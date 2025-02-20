// main.js
import { encryptContent, decryptContent } from './encryption.js';

// Correct publisher and aggregator URLs
const PUBLISHER = 'https://walrus-testnet-publisher.natsai.xyz';
const AGGREGATOR = 'https://walrus-testnet-aggregator.natsai.xyz';

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
      content: contentToStore, // either plaintext or the encrypted object
      syntax: document.getElementById('syntax').value,
