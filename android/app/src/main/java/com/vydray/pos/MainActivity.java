package com.vydray.pos;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SiiPrinterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}