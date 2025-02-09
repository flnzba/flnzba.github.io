---
title: '#23 How to Uninstall and Reinstall Node.js and npm'
description: 'A comprehensive guide on reinstalling Node.js and npm.'
publishDate: '10 February 2025'
updatedDate: '10 February 2025'
coverImage:
  src: './cover-node-reinstall.webp'
  alt: 'Guide to Uninstalling and Reinstalling Node.js and npm'
tags: ['Node.js', 'npm', 'Guide']
---

# How to Uninstall and Reinstall Node.js and npm on Windows, macOS, and Linux (Manually, via Homebrew, and via nvm)

Node.js is an essential runtime for JavaScript, and npm (Node Package Manager) is its package manager. However, there are times when you need to **completely uninstall and reinstall Node.js and npm**, whether due to version conflicts, broken installations, or upgrading to a newer version.

This guide will cover **three different methods** to uninstall and reinstall Node.js and npm on **Windows, macOS, and Linux**.

---

## **🛠 Method 1: Uninstall & Reinstall Node.js and npm Manually**

If you installed Node.js via the official installer or a package manager other than `nvm` or `brew`, you'll need to manually remove it.

### **🔹 Windows (Manual Uninstallation)**

#### **Uninstall Node.js**

1. Open **Control Panel** → **Programs** → **Programs and Features**.
2. Find **Node.js** in the list.
3. Click **Uninstall** and follow the prompts.

#### **Remove npm Cache & Environment Variables**

1. Delete the global npm modules:
   ```sh
   rd /s /q "%AppData%\npm"
   rd /s /q "%AppData%\npm-cache"
   ```
2. Remove Node.js from **System Environment Variables**:
   - Press `Win + R`, type `sysdm.cpl`, and hit Enter.
   - Go to the **Advanced** tab and click **Environment Variables**.
   - Under **System Variables**, find `NODE_PATH`, select it, and click **Delete**.
   - Look for `Path`, edit it, and remove any reference to Node.js.

#### **Verify Node.js Removal**

Run the following in **PowerShell or CMD**:

```sh
node -v
npm -v
```

If it returns `"command not found"`, Node.js has been successfully removed.

---

### **🔹 macOS (Manual Uninstallation)**

#### **Remove Node.js and npm**

1. Open **Terminal** and run:
   ```sh
   sudo rm -rf /usr/local/bin/node
   sudo rm -rf /usr/local/include/node
   sudo rm -rf /usr/local/lib/node_modules
   ```
2. Remove npm cache:
   ```sh
   rm -rf ~/.npm
   rm -rf ~/.node-gyp
   ```
3. If you installed Node.js using the `.pkg` file, you can also remove it via:
   ```sh
   sudo rm -rf /usr/local/lib/dtrace/node.d
   ```

#### **Verify Uninstallation**

```sh
node -v
npm -v
```

If they are no longer recognized, Node.js is fully removed.

---

### **🔹 Linux (Manual Uninstallation)**

#### **Remove Node.js and npm**

1. Run the following command:
   ```sh
   sudo apt-get remove --purge nodejs npm
   ```
2. Clean up global npm packages:
   ```sh
   sudo rm -rf /usr/local/lib/node_modules
   rm -rf ~/.npm
   ```

#### **Verify Uninstallation**

```sh
node -v
npm -v
```

---

## **🛠 Method 2: Uninstall & Reinstall Node.js via Homebrew (macOS & Linux)**

If you installed Node.js via **Homebrew**, you can easily uninstall and reinstall it.

### **🔹 Uninstall Node.js using Homebrew**

1. Open **Terminal** and run:
   ```sh
   brew uninstall node
   ```
2. Clean up leftover files:
   ```sh
   brew cleanup
   ```

#### **Verify Node.js Removal**

```sh
node -v
npm -v
```

If Node.js is not found, it has been successfully removed.

---

### **🔄 Reinstall Node.js using Homebrew**

To reinstall:

```sh
brew install node
```

After installation, verify:

```sh
node -v
npm -v
```

---

## **🛠 Method 3: Uninstall & Reinstall Node.js using nvm (Node Version Manager) (My Personal Preference)**

If you installed Node.js using **nvm**, this is the easiest way to manage multiple Node.js versions.
The link to the source code can be found here: [nvm-sh/nvm](https://github.com/nvm-sh/nvm).

### **🔹 Uninstall Node.js using nvm**

1. Open **Terminal** (or PowerShell for Windows).
2. Run the following command:
   ```sh
   nvm uninstall <version>
   ```
   Replace `<version>` with the installed Node.js version. You can check installed versions with:
   ```sh
   nvm ls
   ```
3. To completely remove `nvm` (optional), delete its directory:
   ```sh
   rm -rf ~/.nvm
   ```

---

### **🔄 Reinstall Node.js using nvm**

1. First, make sure `nvm` is installed:
   ```sh
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   ```
   If you are like me and have some problems with the PATH of your nvm installation, run the following command (from the source repository):
   ```sh
   export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
   ```
2. Reload your shell configuration:
   ```sh
   source ~/.zshrc  # For macOS/Linux (zsh users)
   source ~/.bashrc  # For Linux/macOS (bash users)
   ```
3. Install the latest LTS version of Node.js:
   ```sh
   nvm install --lts
   ```
4. Verify installation:
   ```sh
   node -v
   npm -v
   ```

---

## **🎯 Summary of Uninstallation & Reinstallation Methods**

| Method       | Windows                                      | macOS                     | Linux                     |
| ------------ | -------------------------------------------- | ------------------------- | ------------------------- |
| **Manual**   | Control Panel → Remove Node.js, delete cache | `rm -rf` Node files       | `apt-get remove`          |
| **Homebrew** | ❌ Not available                             | `brew uninstall node`     | `brew uninstall node`     |
| **nvm**      | `nvm uninstall <version>`                    | `nvm uninstall <version>` | `nvm uninstall <version>` |

---

## **🚀 Which Method Should You Use?**

- **For beginners:** Use the **manual method** (Control Panel for Windows, Terminal for macOS/Linux).
- **For developers:** If you installed Node.js via `brew`, use **Homebrew** for easy management.
- **For advanced users:** Use `nvm` if you frequently switch between Node.js versions easily.

---

## **💡 Final Thoughts**

Now you know how to **completely uninstall and reinstall Node.js and npm** using three different methods across **Windows, macOS, and Linux**. Using `nvm` is generally the best option for developers as it allows you to switch between different Node.js versions easily.

Let me know if you run into any issues! 🚀

## TL;DR

- **Manual Method:** Control Panel (Windows), Terminal (macOS/Linux).
- **Homebrew:** `brew uninstall node` (macOS/Linux).
- **nvm:** `nvm uninstall <version>`, `nvm install --lts`.
