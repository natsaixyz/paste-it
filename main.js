/*
 * main.js
 * Main application logic for Paste It!
 */

import { encryptContent, decryptContent } from './encryption.js';
import { PUBLISHER, AGGREGATOR } from './config.js';

// DOM Elements
const textarea = document.getElementById('paste-content');
const tagInput = document.getElementById('tag-input');
const tagsContainer = document.getElementById('tags-input');
const createButton = document.getElementById('create-btn');
const loader = document.getElementById('loader');

// Auto-resize textarea
textarea.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = `${this.scrollHeight}px`;
});

// Tag Input Functionality (max 3 tags)
function addTagFromInput() {
  const tagValue = tagInput.value.trim();
  if (tagValue !== '') {
    if (document.querySelectorAll('#tags-input .tag').length >= 3) {
      tagInput.value = '';
      return;
    }
    const tagSpan = document.createElement('span');
    tagSpan.classList.add('tag');
    tagSpan.setAttribute('data-tag', tagValue);
    tagSpan.textContent = tagValue;
    const removeSpan = document.createElement('span');
    removeSpan.setAttribute('data-role', 'remove');
    removeSpan.textContent = ' x';
    removeSpan.onclick = () => tagsContainer.removeChild(tagSpan);
    tagSpan.appendChild(removeSpan);
    tagsContainer.insertBefore(tagSpan, tagInput);
    tagInput.value = '';
  }
}

tagInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault();
    addTagFromInput();
  }
});
tagInput.addEventListener('blur', addTagFromInput);

// ---------- Create Paste Function ----------
async function createPaste() {
  const captchaToken = hcaptcha.getResponse();
  
  if (!captchaToken) {
    alert("Please complete the captcha challenge.");
    return;
  }
  
  const pasteContent = textarea.value.trim();
  if (!pasteContent) {
    alert("You cannot create an empty paste.");
    return;
  }
  
  try {
    createButton.style.display = 'none';
    loader.style.display = 'block';
    
    const tagElements = document.querySelectorAll('#tags-input .tag');
    const tags = Array.from(tagElements).map(tag => tag.getAttribute('data-tag'));
    
    const expiration = document.getElementById('expiration').value;
    const epochs = expiration === 'never' ? 1000 : parseInt(expiration, 10);
    
    // Get the password from the input field.
    const password = document.getElementById('paste-password').value.trim();
    
    // If a password is provided, encrypt the paste content.
    let contentToStore = pasteContent;
    if (password !== "") {
      contentToStore = await encryptContent(pasteContent, password);
    }
    
    const pasteData = {
      title: document.getElementById('title').value,
      content: contentToStore,
      syntax: document.getElementById('syntax').value,
      tags: tags,
      created: new Date().toISOString(),
      endEpoch: epochs,
      captchaToken: captchaToken
    };
    
    const response = await fetch(`${PUBLISHER}/v1/blobs?epochs=${epochs}`, {
      method: 'PUT',
      body: JSON.stringify(pasteData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    const blobId = result.newlyCreated?.blobObject.blobId || result.alreadyCertified?.blobId;
    
    if (blobId) {
      window.location.hash = blobId;
      // If a password was provided, pass it along so you don't get prompted.
      if (password !== "") {
        loadPaste(blobId, password);
      } else {
        loadPaste(blobId);
      }
      hcaptcha.reset();
    }
  } catch (error) {
    console.error('Error creating paste:', error);
    alert('Error creating paste. Check console for details.');
  } finally {
    createButton.style.display = 'block';
    loader.style.display = 'none';
  }
}

document.getElementById('create-btn').addEventListener('click', createPaste);

// ---------- Load Paste Function ----------
async function loadPaste(blobId, providedPassword) {
  try {
    // Hide the creation form and show loader
    document.getElementById('create-paste').classList.add('hidden');
    loader.style.display = 'block';
    
    const pasteSource = document.getElementById('paste-source');
    pasteSource.textContent = `Loading from: ${AGGREGATOR}/v1/blobs/${blobId}`;
    
    const response = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`);
    if (!response.ok) {
      throw new Error("Paste not available or expired");
    }
    const pasteData = await response.json();
    delete pasteData.captchaToken;
    
    document.getElementById('paste-title').textContent = pasteData.title || 'Untitled Paste';
    
    const pasteMeta = document.getElementById('paste-meta');
    if (pasteData.created) {
      const createdDate = new Date(pasteData.created);
      const expiresText = pasteData.endEpoch === 1000 ? "Never" : `${pasteData.endEpoch} epochs`;
      pasteMeta.textContent = `Created on: ${createdDate.toLocaleString()} | Expires in: ${expiresText}`;
    } else {
      pasteMeta.textContent = "";
    }
    
    // If the paste is encrypted, use providedPassword if available.
    let content = pasteData.content;
    if (typeof content === 'object' && content.encrypted) {
      let decryptionPassword = providedPassword;
      if (!decryptionPassword) {
        decryptionPassword = prompt("This paste is password-protected. Please enter the password:");
        if (!decryptionPassword) {
          alert("Password is required to decrypt this paste.");
          return;
        }
      }
      try {
        content = await decryptContent(content, decryptionPassword);
      } catch (err) {
        alert(err.message);
        return;
      }
    }
    
    const codeElement = document.getElementById('paste-code');
    codeElement.textContent = content;
    codeElement.className = `language-${pasteData.syntax || 'none'}`;
    Prism.highlightElement(codeElement);
    
    const pasteTagsContainer = document.getElementById('paste-tags');
    pasteTagsContainer.innerHTML = '';
    if (pasteData.tags && pasteData.tags.length > 0) {
      pasteData.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.classList.add('tag');
        tagSpan.textContent = tag;
        pasteTagsContainer.appendChild(tagSpan);
      });
    }
    
    pasteSource.textContent = `Paste loaded from: ${AGGREGATOR}/v1/blobs/${blobId}`;
    document.getElementById('paste-result').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading paste:', error);
    alert('Error loading paste. It may have expired or been deleted.');
  } finally {
    loader.style.display = 'none';
  }
}

// ---------- Action Buttons for loaded paste ----------
document.getElementById('copy-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("Link copied to clipboard"))
    .catch(err => console.error("Error copying link", err));
});

document.getElementById('copy-content').addEventListener('click', (e) => {
  e.preventDefault();
  const content = document.getElementById('paste-code').innerText;
  navigator.clipboard.writeText(content)
    .then(() => alert("Content copied to clipboard"))
    .catch(err => console.error("Error copying content", err));
});

document.getElementById('share-link').addEventListener('click', (e) => {
  e.preventDefault();
  if (navigator.share) {
    navigator.share({
      title: document.getElementById('paste-title').innerText,
      text: document.getElementById('paste-meta').innerText,
      url: window.location.href
    }).catch(err => console.error("Error sharing", err));
  } else {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert("Link copied to clipboard"))
      .catch(err => console.error("Error copying link", err));
  }
});

document.getElementById('print-page').addEventListener('click', (e) => {
  e.preventDefault();
  window.print();
});

// Toggle password visibility using Font Awesome icons
document.getElementById('toggle-password').addEventListener('click', function() {
  const pwdField = document.getElementById('paste-password');
  if (pwdField.type === "password") {
    pwdField.type = "text";
    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    pwdField.type = "password";
    this.innerHTML = '<i class="fas fa-eye"></i>';
  }
});

// On DOM ready, if there's a hash, load the paste immediately
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('current-year').textContent = new Date().getFullYear();
  if (window.location.hash) {
    const blobId = window.location.hash.substring(1);
    document.getElementById('create-paste').classList.add('hidden');
    document.getElementById('paste-source').textContent = `Loading from: ${AGGREGATOR}/v1/blobs/${blobId}`;
    loadPaste(blobId);
  }
});
