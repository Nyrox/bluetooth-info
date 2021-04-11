import { app, BrowserWindow, ipcMain } from 'electron';
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

const path = require("path")

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: true,
		}
	})

	// electron forge
	win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)
	win.webContents.openDevTools()
	/*
	Store the callback for the requestDevice call on the render thread.
	NOTE: This obviously will break if multiple calls to requestDevice are issued at once. Might be worth handling.
	*/
	let select_device_callback = null;
	win.webContents.on('select-bluetooth-device', (event, devices, callback) => {

		select_device_callback = callback;
		// Prevent returning the first device, so we can implement our own picker UI
		event.preventDefault();

		win.webContents.send("bluetooth-devices-found", devices)
	});

	ipcMain.on("select-bluetooth-device", (ev, evdata) => {
		select_device_callback(evdata)
		select_device_callback = null
	})
}

app.whenReady().then(() => {
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
