# Paste It! - Decentralized Pastebin Alternative

[Live Demo](https://paste.natsai.xyz)

Paste It! is a secure, decentralized pastebin alternative that allows you to create, encrypt, and share text pastes quickly and easily. Built as a static web app using HTML, CSS, and JavaScript, it leverages the [Walrus network](https://www.walrus.xyz/about) for distributed storage of paste data.

## Live Examples

- **Live Demo:** [https://paste.natsai.xyz](https://paste.natsai.xyz)
- **Sample Paste:** [Example Paste](https://paste.natsai.xyz/#K93t1uH1sJnMuxpX9yr5nJaZUxgPgKJt2jh0yxhM-nM)

## Features

- **Decentralized Storage:** Utilizes Walrus's publisher and aggregator to store paste data on a decentralized network.
- **Client-Side Encryption:** Optionally protect your paste with a password using PBKDF2 and AES-GCM, ensuring that only users with the password can decrypt the content.
- **Syntax Highlighting:** Supports syntax highlighting for popular programming languages using Prism.
- **Responsive & Lightweight:** Built entirely with static files (HTML, CSS, and JavaScript) for fast load times and easy hosting.
- **No Backend Required:** Runs completely on the client side, making it simple to deploy on platforms like GitHub Pages or Cloudflare Pages.

## How It Works

1. **Creating a Paste:**  
   Enter your paste content, title, select an expiration, choose syntax highlighting, and optionally protect your paste with a password. Your data is encrypted (if a password is provided) before being sent to Walrus via an HTTP PUT request.
   
2. **Viewing a Paste:**  
   When someone accesses a paste URL (e.g., [https://paste.natsai.xyz/#yourBlobId](https://paste.natsai.xyz/#yourBlobId)), the app fetches the data from Walrus. If the paste is password protected, the user is prompted to enter the password for decryption.

3. **Decentralized and Secure:**  
   By leveraging Walrus, Paste It! removes the need for a centralized server. Data is stored on a decentralized network, and encryption is performed entirely on the client side.

## Installation

To run this project locally:

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/natsaixyz/paste-it.git
   cd paste-it
