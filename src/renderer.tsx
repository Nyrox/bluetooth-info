
import './index.css';

import * as React from "react"
import * as ReactDOM from "react-dom"
import { ipcRenderer } from "electron";

const bluetooth = (navigator as any).bluetooth

const ScanningView = ({ onDeviceFound }) => {
	const [isScanning, setIsScanning] = React.useState(false)
	const [connectedDevice, setConnectedDevice] = React.useState(null)
	const [scannedDevices, setScannedDevices] = React.useState(new Map())

	const startScan = React.useCallback(async () => {
		setIsScanning(true)
		console.log("Starting scan...")
		// const device = await bluetooth.requestDevice({ acceptAllDevices: true })
		const device = await bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['battery_service'] })
		setConnectedDevice(device)
		setIsScanning(false)
		onDeviceFound(device)
	}, [])

	const onDevicesFound = (ev, evdata) => {
		const newDevices = new Map(scannedDevices)
		evdata.forEach(device => {
			newDevices.set(device.deviceId, device.deviceName)
		});

		setScannedDevices(newDevices)
	}

	const connectDevice = (uuid) => {
		ipcRenderer.send("select-bluetooth-device", uuid)
	}

	React.useEffect(() => {
		ipcRenderer.on("bluetooth-devices-found", onDevicesFound)
		return (() => {
			ipcRenderer.removeListener("bluetooth-devices-found", onDevicesFound)
		})
	})

	return (<>
		{ isScanning ?
			(<>
				<p>Scanning...</p>
				<ul className="device-list">
					{ Array.from(scannedDevices.entries(), ([k, v]) => {
						return (<li key={k} onClick={() => connectDevice(k)}>
							<p>{v}</p>
							<p>{k}</p>
						</li>)
					})}
				</ul>
			</>) :
			(<button onClick={startScan}>Start scanning</button>)
		}
	</>)
}

const DetailView = ({device}) => {
	const [gatt, setGatt] = React.useState(null)
	console.log(device)

	React.useEffect(() => {
		device.gatt.connect()
			.then(g => {
				setGatt(g)
				g.getPrimaryService('battery_service').then(console.log)
			})
	})

	return (<>
		<p>Connected Device: {device.name ?? "unknown"} ({device.id})</p>
	</>)
}


const Application = () => {
	const [device, setDevice] = React.useState(null)


	return device == null ?
		<ScanningView onDeviceFound={d => setDevice(d)} /> :
		<DetailView device={device} />
}


ReactDOM.render(<Application />, document.querySelector("#react-root"))
