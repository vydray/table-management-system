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

            // Android 12以降の権限チェック
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                if (getContext().checkSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT) 
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    call.reject("Bluetooth permission not granted. Please enable in device settings.");
                    return;
                }
            }

            if (!bluetoothAdapter.isEnabled()) {
                // 権限エラーを回避するため、すでに有効な場合はスキップ
                call.resolve();
                return;
            }

            call.resolve();
        } catch (Exception e) {
            call.reject("Enable error: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        try {
            // Android 12以降の権限チェック
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                if (getContext().checkSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT) 
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    Log.e(TAG, "BLUETOOTH_CONNECT permission not granted");
                    call.reject("Bluetooth permission not granted");
                    return;
                }
            }
            
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
            Log.e(TAG, "Failed to get paired devices", e);
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
    @PluginMethod
    public void printOrderSlip(PluginCall call) {
        try {
            // パラメータを取得
            String tableName = call.getString("tableName", "");
            String guestName = call.getString("guestName", "");
            String castName = call.getString("castName", "");
            String elapsedTime = call.getString("elapsedTime", "");
            String timestamp = call.getString("timestamp", "");
            
            int subtotal = call.getInt("subtotal", 0);
            int serviceTax = call.getInt("serviceTax", 0);
            int roundedTotal = call.getInt("roundedTotal", 0);
            int roundingAdjustment = call.getInt("roundingAdjustment", 0);
            
            JSArray orderItems = call.getArray("orderItems");
            
            // 日本語対応
            printerManager.setCodePage(PrinterManager.CODE_PAGE_KATAKANA);
            printerManager.setInternationalCharacter(PrinterManager.COUNTRY_JAPAN);
            
            // ヘッダー
            printerManager.setAlignment(PrintAlignment.CENTER);
            printerManager.sendText("会計伝票\n");
            printerManager.sendText("================================\n");
            
            // 基本情報
            printerManager.setAlignment(PrintAlignment.LEFT);
            printerManager.sendText("卓番号: " + tableName + "\n");
            printerManager.sendText("お客様: " + guestName + "\n");
            printerManager.sendText("推し: " + castName + "\n");
            printerManager.sendText("滞在時間: " + elapsedTime + "\n");
            printerManager.sendText("印刷時刻: " + timestamp + "\n");
            printerManager.sendText("================================\n");
            
            // 注文明細
            printerManager.sendText("【注文明細】\n");
            if (orderItems != null) {
                for (int i = 0; i < orderItems.length(); i++) {
                    try {
                        JSObject item = orderItems.getJSObject(i);
                        String name = item.getString("name");
                        String cast = item.getString("cast", "");
                        int quantity = item.getInt("quantity");
                        int price = item.getInt("price");
                        int total = quantity * price;
                        
                        // 商品名
                        printerManager.sendText(name + "\n");
                        
                        // キャスト名がある場合
                        if (!cast.isEmpty()) {
                            printerManager.sendText("  (" + cast + ")\n");
                        }
                        
                        // 数量と金額
                        String quantityStr = String.format("  %d × ¥%,d", quantity, price);
                        String totalStr = String.format("¥%,d", total);
                        
                        // 右寄せのために空白を計算
                        int lineLength = 32; // 32文字幅を想定
                        int spacesNeeded = lineLength - quantityStr.length() - totalStr.length();
                        if (spacesNeeded < 1) spacesNeeded = 1;
                        
                        String spaces = new String(new char[spacesNeeded]).replace('\0', ' ');
                        printerManager.sendText(quantityStr + spaces + totalStr + "\n");
                        
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to print order item", e);
                    }
                }
            }
            
            printerManager.sendText("--------------------------------\n");
            
            // 合計
            String subtotalLine = String.format("小計:%26s", String.format("¥%,d", subtotal));
            printerManager.sendText(subtotalLine + "\n");
            
            String serviceLine = String.format("サービス料:%19s", String.format("¥%,d", serviceTax));
            printerManager.sendText(serviceLine + "\n");
            
            if (roundingAdjustment != 0) {
                String adjustLine = String.format("端数調整:%22s", String.format("%s¥%,d", 
                    roundingAdjustment < 0 ? "-" : "+", 
                    Math.abs(roundingAdjustment)));
                printerManager.sendText(adjustLine + "\n");
            }
            
            printerManager.sendText("================================\n");
            
            // 合計金額（太字）
            printerManager.setCharacterBold(CharacterBold.BOLD_CANCEL);
            String totalLine = String.format("合計金額:%22s", String.format("¥%,d", roundedTotal));
            printerManager.sendText(totalLine + "\n");
            printerManager.setCharacterBold(CharacterBold.BOLD_CANCEL);
            
            printerManager.sendText("================================\n");
            
            // フッター
            printerManager.setAlignment(PrintAlignment.CENTER);
            printerManager.sendText("\n※この伝票は会計時にご提示ください\n\n\n");
            
            // カット
            printerManager.cutPaper(CuttingMethod.CUT_PARTIAL);
            
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to print order slip: " + e.getMessage(), e);
        }
    }




}