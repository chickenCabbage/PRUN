import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Timer;
import java.util.TimerTask;

import javax.imageio.ImageIO;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.stage.Stage;

public class Run extends Application {
	private Stage stage;
	int delay = 120000;
	private Timer checkTimer = new Timer();
	static boolean syncBool, alertBool;
	String updateDetails;

	@Override
	public void start(final Stage stage) {
		try {
			updateDetails = Utils.getHTML(Utils.addr + "/update.txt");
			System.out.println("Starting up...\nUpdate details are as follows:\n" + updateDetails);
		}
		catch (Exception ExceptionHTTP) {
			System.out.println("Could not initialize HTTP data.");
			ExceptionHTTP.printStackTrace();
		}

		this.stage = stage;
		Platform.setImplicitExit(false);
		javax.swing.SwingUtilities.invokeLater(this::addAppToTray);
		stage.setOnCloseRequest(event -> closeStage());
		stage.setMinHeight(550);
		stage.setMinWidth(800);

		try {
			Scene scene = new Scene(FXMLLoader.load(Run.class.getResource("Frame.fxml")));
			stage.setScene(scene);
			System.out.println("Set scene.");
		}
		catch (Exception ExLoad) {
			System.out.println("Could not load the frame content.");
			ExLoad.printStackTrace();
		}
	}

	private void addAppToTray() {
		try {
			//Ensure java.awt is initialised.
			java.awt.Toolkit.getDefaultToolkit();

			if (!java.awt.SystemTray.isSupported()) {
				System.out.println("No system tray support, application exiting.");
				Platform.exit();
			}

			java.awt.SystemTray tray = java.awt.SystemTray.getSystemTray();
			java.awt.Image icon = ImageIO.read(Run.class.getResource("iconSmall.png"));
			java.awt.TrayIcon trayIcon = new java.awt.TrayIcon(icon);
			System.out.println("Successfully set icon.");

			trayIcon.addActionListener(event -> Platform.runLater(this::showStage));

			java.awt.MenuItem openItem = new java.awt.MenuItem("Open the app");
			openItem.addActionListener(event -> Platform.runLater(this::showStage));

			java.awt.MenuItem exitItem = new java.awt.MenuItem("Exit PRUN");
			exitItem.addActionListener(event -> {
				checkTimer.cancel();
				tray.remove(trayIcon);
				Platform.exit();
			});

			final java.awt.PopupMenu popup = new java.awt.PopupMenu();
			popup.add(openItem);
			popup.addSeparator();
			popup.add(exitItem);
			trayIcon.setPopupMenu(popup);
			System.out.println("Set menu.");

			TimerTask tt = new TimerTask() {
				@Override
				public void run() {
					if(!syncBool) {
						System.exit(0);
					}
					try {
						System.out.println("Checking for update...");
						String newDetails = Utils.getHTML(Utils.addr + "/update.txt");
						if(!newDetails.equals(updateDetails)) {
							updateDetails = newDetails;
							System.out.println("New update! Alerts are " + alertBool + ".");
							if(alertBool) javax.swing.SwingUtilities.invokeLater(() -> trayIcon.displayMessage(
								"Prague Race has just updated!",
								updateDetails.split("\n")[1] + " on " + updateDetails.split("\n")[0],
								java.awt.TrayIcon.MessageType.INFO
							));
						}
					}
					catch (Exception ExceptionHTTP) {
						System.out.println("Could not fetch HTTP data.");
						ExceptionHTTP.printStackTrace();
					}
				}
			};
			checkTimer.schedule(tt, delay, delay);
			System.out.println("Scheduled timer, checking every " + (delay / 1000) + " seconds.");

			tray.add(trayIcon);
			System.out.println("App added to tray!");
			
			Image stageIcon = new Image(Run.class.getResource("iconBig.png").toString());
			stage.getIcons().add(stageIcon);
			stage.setTitle("PRUN Desktop");
			
			Platform.runLater(this::showStage);
		}
		catch (Exception ExceptionInit) {
			System.out.println("Unable to initialize system tray.");
			ExceptionInit.printStackTrace();
		}
	}

	private void showStage() {
		System.out.println("Showing stage.");
		if (stage != null) {
			stage.show();
			stage.toFront();
		}
	}
	
	private void closeStage() {
		System.out.println("Closing stage.");
		stage.hide();
		try {
			BufferedWriter bw = new BufferedWriter(new FileWriter(Utils.prefsLoc));
			bw.write("$sync: " + syncBool);
			bw.newLine();
			bw.write("$alert: " + alertBool);
			bw.newLine();
			bw.write("Do not change the content of this file unless you know what you are doing.");
			bw.close();
			
			if(!syncBool) {
				System.out.println("Sync is disabled!");
				System.exit(0);
			}
		}
		catch (Exception ExceptionWrite) {
			System.out.println("Could not save preferences!");
			ExceptionWrite.printStackTrace();
		}
	}

	public static void main(String[] args) throws IOException, java.awt.AWTException {
		launch(args);
	}
}
