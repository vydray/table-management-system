package com.vydray.pos;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.util.Log;

import com.seikoinstruments.sdk.thermalprinter.PrinterManager;
import com.seikoinstruments.sdk.thermalprinter.PrinterException;
import com.seikoinstruments.sdk.thermalprinter.printerenum.CharacterBold;
import com.seikoinstruments.sdk.thermalprinter.printerenum.CharacterUnderline;
import com.seikoinstruments.sdk.thermalprinter.printerenum.CharacterReverse;
import com.seikoinstruments.sdk.thermalprinter.printerenum.CharacterFont;
import com.seikoinstruments.sdk.thermalprinter.printerenum.CharacterScale;
import com.seikoinstruments.sdk.thermalprinter.printerenum.PrintAlignment;
import com.seikoinstruments.sdk.thermalprinter.printerenum.CuttingMethod;

import java.util.Set;

@CapacitorPlugin(name = "SiiPrinter")
public class SiiPrinterPlugin extends Plugin {
    private static final String TAG = "SiiPrinterPlugin";
    private PrinterManager printerManager;
    private BluetoothAdapter bluetoothAdapter;

    @Override
    public void load() {
        super.load();
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        printerManager = new PrinterManager(getContext());
    }

    @PluginMethod
    public void enable(PluginCall call) {
        try {
            if (bluetoothAdapter == null) {
                call.reject("Bluetooth not supported");
                return;
            }

            if (!bluetoothAdapter.isEnabled()) {
                bluetoothAdapter.enable();
            }

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to enable Bluetooth", e);
        }
    }

    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        try {
            Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
            JSArray devices = new JSArray();
            
            for (BluetoothDevice device : pairedDevices) {
                JSObject deviceInfo = new JSObject();
                deviceInfo.put("name", device.getName());
                deviceInfo.put("address", device.getAddress());
                devices.put(deviceInfo);
            }

            JSObject result = new JSObject();
            result.put("devices", devices);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to get paired devices", e);
        }
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String address = call.getString("address");
        
        if (address == null) {
            call.reject("Address is required");
            return;
        }

        try {
            // MP-B20のモデル番号は6
            int modelNumber = PrinterManager.PRINTER_MODEL_MP_B20;
            // Bluetooth接続（セキュア接続）
            printerManager.connect(modelNumber, address, true);
            call.resolve();
        } catch (PrinterException e) {
            call.reject("Failed to connect: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        try {
            printerManager.disconnect();
            call.resolve();
        } catch (PrinterException e) {
            call.reject("Failed to disconnect", e);
        }
    }

    @PluginMethod
    public void printText(PluginCall call) {
        String text = call.getString("text");
        
        if (text == null) {
            call.reject("Text is required");
            return;
        }

        try {
            // シンプルなテキスト印刷
            printerManager.sendText(text);
            
            // カット
            printerManager.cutPaper(CuttingMethod.CUT_PARTIAL);
            
            call.resolve();
        } catch (PrinterException e) {
            call.reject("Failed to print: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void printReceipt(PluginCall call) {
        try {
            String storeName = call.getString("storeName", "");
            String footerMessage = call.getString("footerMessage", "");
            
            // 日本語対応
            printerManager.setCodePage(PrinterManager.CODE_PAGE_KATAKANA);
            printerManager.setInternationalCharacter(PrinterManager.COUNTRY_JAPAN);
            
            // シンプルな実装に変更
            printerManager.sendText(storeName + "\n");
            printerManager.sendText("\n日時: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()) + "\n");
            printerManager.sendText("--------------------------------\n");
            printerManager.sendText("テスト商品1         ¥500\n");
            printerManager.sendText("テスト商品2         ¥300\n");
            printerManager.sendText("--------------------------------\n");
            printerManager.sendText("合計:              ¥800\n");
            printerManager.sendText("\n" + footerMessage + "\n\n");
            
            // カット
            printerManager.cutPaper(CuttingMethod.CUT_PARTIAL);
            
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to print receipt: " + e.getMessage(), e);
        }
    }
}