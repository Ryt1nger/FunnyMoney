package com.funnymoney.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // WebView должен занимать область между системными панелями. Раньше здесь
    // был edge-to-edge режим, а экраны дополнительно добавляли safe-area сверху,
    // поэтому высота статус-бара учитывалась дважды и весь контент съезжал вниз.
    // В обычном режиме Android сам уменьшает высоту WebView, не смещая его
    // внутреннюю раскладку.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    getWindow().setStatusBarColor(Color.rgb(251, 239, 225));
    getWindow().setNavigationBarColor(Color.rgb(251, 239, 225));

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      getWindow().setNavigationBarContrastEnforced(false);
    }

    WindowInsetsControllerCompat controller =
        new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
    // Системные панели теперь отдельные и светлые, как фон приложения.
    controller.setAppearanceLightStatusBars(true);
    controller.setAppearanceLightNavigationBars(true);
  }
}
