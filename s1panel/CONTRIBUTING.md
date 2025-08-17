# Contributing to s1panel

First off, thank you for considering contributing to `s1panel`! As you've probably gathered from the main `README.md`, this is a hobby project born out of a desire to make a cool piece of hardware work on Linux. Any and all contributions, from documentation to new features, are incredibly welcome.

Working on this project, especially on Windows, can be a bit tricky due to some native dependencies that need to be compiled. This guide is here to walk you through setting up a proper development environment so you can get up and running without pulling your hair out.

## Setting up the Development Environment on Windows

The main hurdle on Windows is successfully running `npm install`. This command needs to compile native C++ modules for libraries like `canvas` (for drawing), `node-hid` (for LCD communication), and `usb`. This requires a specific set of tools. Follow these steps carefully.

### 1. Install and Use the Correct Node.js Version

> [!IMPORTANT]
> This is a critical step. The project's native dependencies, particularly `canvas`, have known compatibility issues with the latest versions of Node.js (v22+). The most stable and confirmed working version is from the **Node.js v20 LTS** line.

The best way to manage multiple Node.js versions is by using **NVM for Windows**.

1.  Download and install `nvm-windows` from the [official releases page](https://github.com/coreybutler/nvm-windows/releases).
2.  Open a new terminal (**PowerShell or CMD, as an Administrator**) and run the following commands to install and switch to a known working version:

    ```bash
    # Install version 20.19.2 (confirmed to be functional)
    nvm install 20.19.2

    # Switch to that version
    nvm use 20.19.2

    # Verify that the version is correct
    node -v
    # It should display v20.19.2
    ```

### 2. Install C++ Build Tools

The native modules need a C++ compiler. The easiest way to get this is with Visual Studio.

1.  Open the **"Visual Studio Installer"**. If you don't have it, download it from the [Visual Studio site](https://visualstudio.microsoft.com/downloads/).
2.  Click **"Modify"** on your Visual Studio installation (e.g., Visual Studio Community 2022).
3.  In the **"Workloads"** tab, make sure the **"Desktop development with C++"** workload is checked. If it's not, check it and install it.

### 3. Install the GTK 2 Runtime

> [!NOTE]
> The `canvas` library depends on the `Cairo` graphics library. On Windows, the easiest way to provide this dependency is by installing the GTK 2 runtime environment.

1.  Download the **GTK 2 for Windows 64-bit** installer. The one known to work is `gtk2-runtime-2.24.33-2020-10-18-ts-win64.exe`, which you can find [here](https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases/tag/2021-01-30).
2.  Run the installer. The default installation path is typically `"C:\Program Files\GTK2-Runtime Win64"`.
3.  **Verify your PATH environment variable**. The installer should automatically add its `bin` folder to your system's PATH. To be sure:
    *   Search for "Edit the system environment variables" in the Windows Start Menu and open it.
    *   Go to "Environment Variables..." -> "System variables" -> select "Path" and "Edit".
    *   Confirm that an entry like `"C:\Program Files\GTK2-Runtime Win64\bin"` exists. If not, add it manually.

### 4. Ensure Python is Installed

`node-gyp`, the tool that compiles the modules, requires Python.

1.  Install a recent version of Python (3.9 or newer). The easiest way is via `winget` or by downloading from `python.org`.
    ```powershell
    winget install Python.Python.3
    ```
2.  During installation, ensure the "Add Python to PATH" option is checked. You can verify this by opening a new terminal and running `python --version`.

## Final Installation Steps

Once all the dependencies above are installed and configured, the final process is straightforward.

1.  Open a new terminal **as an Administrator**.
2.  Make sure you are using the correct version of Node.js:
    ```bash
    nvm use 20.19.2
    ```
3.  Navigate to the `s1panel` project folder:
    ```bash
    cd path/to/AceMagic-S1-LED-TFT-Linux/s1panel
    ```
4.  Run the Node.js dependency installation:
    ```bash
    npm install
    ```

If the environment is set up correctly, the command should complete without any compilation errors, and you'll be ready to run the project on Windows.

## Running the Project

Once you have successfully installed all dependencies, you can run the project using the following command from the `s1panel` directory:

```bash
cls && cd gui && npm run build && cd .. && node main.js
```

This command will:
1. Clear the console (`cls`)
2. Navigate to the GUI directory (`cd gui`)
3. Build the frontend application (`npm run build`)
4. Return to the main s1panel directory (`cd ..`)
5. Start the main application (`node main.js`)

## Submitting Changes

-   Fork the repository.
-   Create a new branch for your changes (`git checkout -b feature/my-new-feature`).
-   Make your changes and commit them (`git commit -m 'Add some amazing feature'`).
-   Push to your branch (`git push origin feature/my-new-feature`).
-   Open a Pull Request.

Thanks again for your interest
