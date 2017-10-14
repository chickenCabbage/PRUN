import java.io.BufferedReader;
import java.io.FileReader;
import java.net.URL;
import java.util.ResourceBundle;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.control.CheckBox;
import javafx.scene.web.WebView;

public class Controller implements Initializable {
	@FXML private WebView webView;
	@FXML private CheckBox syncBox, alertBox;
	@FXML private Button helpButton, homeButton;
	private boolean syncBool, alertBool;
	@Override
	public void initialize(URL location, ResourceBundle resources) {
		System.out.println("Initing JFX...");
		try {
			BufferedReader br = new BufferedReader(new FileReader(Utils.prefsLoc));
			String line = null;
			do {
				line = br.readLine();
				if(line != null && line.indexOf("$sync: ") == 0) syncBool = Boolean.parseBoolean(line.split(": ")[1]);
				if(line != null && line.indexOf("$alert: ") == 0) alertBool = Boolean.parseBoolean(line.split(": ")[1]);
			} while(line != null);
			syncBox.setSelected(syncBool);
			alertBox.setSelected(alertBool);
			Run.syncBool = syncBool;
			Run.alertBool = alertBool;
			System.out.println("Preferences set.");
			br.close();
		}
		catch (Exception ExceptionRead) {
			System.out.println("Could not read preferences!");
			ExceptionRead.printStackTrace();
		}
		syncBox.setStyle("-fx-focus-color: black; -fx-faint-focus-color: transparent;");
		alertBox.setStyle("-fx-focus-color: black; -fx-faint-focus-color: transparent;");
		webView.setStyle("-fx-focus-color: black; -fx-faint-focus-color: transparent;");
		helpButton.setStyle("-fx-focus-color: black; -fx-faint-focus-color: transparent;");
		homeButton.setStyle("-fx-focus-color: black; -fx-faint-focus-color: transparent;");
		
		goHome();
	}
	
	@FXML public void goHome() {
		webView.getEngine().load(Utils.addr);
		System.out.println("Navigated the WebView home.");
	}

	@FXML public void onSyncChange() {
		Run.syncBool = syncBox.isSelected();
	}

	@FXML public void onAlertChange() {
		Run.alertBool = alertBox.isSelected();
	}
}
