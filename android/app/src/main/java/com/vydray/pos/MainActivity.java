package com.vydray.pos;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginManager;
import com.getcapacitor.Plugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
    
    @Override
    protected void init(Bundle savedInstanceState, ArrayList<Class<? extends Plugin>> plugins) {
        // SiiPrinterプラグインを追加
        plugins.add(SiiPrinterPlugin.class);
        super.init(savedInstanceState, plugins);
    }
}