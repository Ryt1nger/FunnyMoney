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

    // Настоящий edge-to-edge: WebView рисуется на весь экран, под системными
    // панелями, а не просто ужимается под их отступы — панели становятся
    // прозрачными и накладываются поверх контента, а не занимают своё место.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    getWindow().setStatusBarColor(Color.TRANSPARENT);
    // Если на устройстве есть системная navigation bar, она должна быть
    // отдельной чёрной областью, а не прозрачным слоем поверх контента.
    // На устройствах без такой панели Android сам не создаёт этот цветной
    // участок, поэтому дополнительного отступа в приложении не появляется.
    getWindow().setNavigationBarColor(Color.BLACK);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      // На Android 10+ система по умолчанию подкладывает под жестовую панель
      // затемняющую подложку для контраста — она-то и выглядит как "серая
      // полоса" поверх приложения. Отключаем, раз панель и так прозрачная.
      getWindow().setNavigationBarContrastEnforced(false);
    }

    WindowInsetsControllerCompat controller =
        new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
    // Верх приложения почти везде тёмный/цветной фон — белые иконки статус-бара
    // читаются на нём лучше, чем тёмные.
    controller.setAppearanceLightStatusBars(false);
    // На чёрной системной панели используем светлые системные кнопки.
    controller.setAppearanceLightNavigationBars(false);
  }
}
