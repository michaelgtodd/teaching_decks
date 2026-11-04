# Deck 5 sources: Elastic

Documented version: **Elastic 2026.1.1**, the version WPILib 2026.2.1 installs. Newer 2026.1.2 exists but is not what the installer delivers.
Checked 2026-11-04. UI labels come from Elastic source at tag `v2026.1.1`, because the docs lag the app (see "Conflicts").

## Conflicts found (read these first)

1. **Tab does not send a value in Elastic.** The 2026 KitBot Java guide (Rev. Feb 3 2026, p.22) says to "use the tab key to move out of the box and send the value to the robot (using Enter will disable the robot if it is enabled)". In Elastic, `text_display.dart` publishes only from `onSubmitted` or the submit button, unchanged at `v2026.1.1`, `v2026.1.2` and `main`. Flutter 3.38.6, Elastic's pinned version, does not call `onSubmitted` on focus loss (`_handleFocusChanged` in `editable_text.dart`; `_finalizeEditing` runs from `performAction` and `connectionClosed`). PR #175 added a red underline for unpublished text. The deck teaches the submit button. **Read from source, not tested in the app: nothing may be executed here.** Try it once before class.
2. **`setDefaultNumber` does not keep a typed value through a code restart with Elastic.** NT4 lets a dashboard re-send a value after reconnect (spec, "Caching and Reconnection Handling"), but Elastic's `nt4_client.dart` re-publishes topics without re-sending values and clears `lastAnnouncedValues`. So a typed value is lost on restart whether startup used `putNumber` or `setDefaultNumber`. The real differences: `putNumber` writes every time it runs (in `periodic` it overwrites the box each loop), and `putNumber` overwrites a persistent value at startup while `setDefaultNumber` does not (`SetDefaultEntryValue` only acts if `!topic->lastValue`; `RobotBase` starts the server, restoring `networktables.json`, before user code). The deck says this rather than the simpler "putNumber resets it on restart". The KitBot guide's advice, put good values in Constants, holds either way.
3. **Elastic docs labels differ from the 2026.1.1 app.** Docs: `Export Layout`, `Load Layout From Robot`. Source: `Save As` (`dashboard_page.dart`, `model.exportLayout`), `Download From Robot`. The deck uses the source labels.
4. **Driver Station tab name.** frc-docs says Setup tab (gear icon); the KitBot guide says Settings (gear) tab. The deck says "gear tab".

## Could not confirm

- **Elastic in the Driver Station `Dashboard Type` dropdown.** Stated by the KitBot guide p.21. frc-docs `driver-station.rst` lists Default, LabVIEW, SmartDashboard, Shuffleboard and Remote, and no screenshot shows the open list. Notes tell mentors to use Start Tool if it is missing.
- **Enter while focus is in Elastic.** That Enter reaches the Driver Station is from the KitBot guide and the frc-docs shortcut list, not tested here.
- **Slides were not viewed rendered.** No browser is available; fit relies on the build checks.

## Claims and sources

| Claim | Source |
|---|---|
| WPILib 2026.2.1 ships Elastic 2026.1.1 | https://github.com/wpilibsuite/WPILibInstaller-Avalonia/blob/v2026.2.1/scripts/versions.gradle (`elasticGitTag`), https://docs.wpilib.org/en/stable/docs/yearly-overview/yearly-changelog.html |
| Elastic made by Team 353; VS Code: WPILib Command Palette, Start Tool, Elastic | https://docs.wpilib.org/en/stable/docs/software/dashboards/elastic.html |
| Dashboard purpose; driver vs programming; focus leaves the match; LEDs | https://docs.wpilib.org/en/stable/docs/software/dashboards/dashboard-intro.html |
| NetworkTables concepts; persistent topics | https://docs.wpilib.org/en/stable/docs/software/networktables/networktables-intro.html |
| Settings tabs, Team Number, IP Address, IP Address Mode, Auto Show Text Submit Button (Appearance tab) | https://github.com/Gold872/elastic_dashboard/blob/v2026.1.1/lib/widgets/settings_dialog.dart |
| IP mode names | https://github.com/Gold872/elastic_dashboard/blob/v2026.1.1/lib/services/ip_address_util.dart |
| Ctrl+K, Ctrl+Shift+K, Ctrl+S, Ctrl+Shift+S, Ctrl+O, Ctrl+D; File, Edit, Help, Settings, Add Widget | https://github.com/Gold872/elastic_dashboard/blob/v2026.1.1/lib/pages/dashboard_page.dart |
| Footer text; team label | `lib/pages/dashboard/dashboard_page_footer.dart`; https://frc-elastic.gitbook.io/docs/getting-started/connecting-to-your-robot |
| Starting tabs Teleoperated and Autonomous | `lib/pages/dashboard/dashboard_page_tabs.dart` |
| Tab menu: Rename, Duplicate, Close | `lib/widgets/editable_tab_bar.dart` |
| Widget menu: Edit Properties, Copy, Remove, Show As; empty grid: Add Widget, Clear Layout, Paste | `lib/widgets/tab_grid.dart`, `lib/widgets/draggable_containers/models/nt_widget_container_model.dart` |
| Add Widget dialog tabs: Network Tables, Layouts; List Layout | `lib/pages/dashboard/add_widget_dialog.dart`; https://frc-elastic.gitbook.io/docs/customizing-your-dashboard/adding-and-customizing-layouts |
| Drag, red and green outlines, resize | https://frc-elastic.gitbook.io/docs/customizing-your-dashboard/adding-and-customizing-widgets |
| Lock Layout behaviour; Save stored internally | https://frc-elastic.gitbook.io/docs/getting-started/app-navigation |
| Add Widget, expand SmartDashboard, drag each value out; "shared dictionary"; Constants advice; Enter warning | https://firstfrc.blob.core.windows.net/frc2026/KitBot/2026-kitbot-java-guide.pdf (pp.21-22) |
| Show Submit Button; shown automatically for persistent topics; red underline | `lib/widgets/nt_widgets/single_topic/text_display.dart`; PR #175 |
| PIDController widget sends only from Publish Values (`onSubmitted` is empty) | `lib/widgets/nt_widgets/multi_topic/pid_controller.dart` |
| Chooser widget: green check, red mark and tooltip; re-sends pick after restart | `lib/widgets/nt_widgets/multi_topic/combo_box_chooser.dart` |
| Show As on a chooser stops it publishing in 2026.1.1, fixed in 2026.1.2 | https://github.com/Gold872/elastic_dashboard/releases/tag/v2026.1.2, PR #344 |
| Blank widget after a rename: subscriptions reset to null on connect | `lib/services/nt4_client.dart` (`_onFirstMessageReceived`) |
| Dimmed widgets when disconnected | `nt_widget_container_model.dart` (`opacity`); Connecting to Your Robot page |
| Default Period 0.06 s; Default Graph Period 0.033 s | `lib/services/settings.dart` |
| Voltage View 4 to 13 V; Graph shows one topic, 5 s default | `lib/widgets/nt_widgets/single_topic/voltage_view.dart`, `graph.dart` |
| Remote layout: `WebServer.start(5800, ...)`, deploy root, `.json`, Overwrite, Merge, Ctrl+D | https://frc-elastic.gitbook.io/docs/additional-features-and-references/remote-layout-downloading; `lib/services/elastic_layout_downloader.dart`; `lib/pages/dashboard_page.dart` |
| `Elastic.java`, `sendNotification`, `selectTab`, 3 s default, `withNoAutoDismiss`, Jackson imports | https://github.com/Gold872/elastic_dashboard/blob/v2026.1.1/elasticlib/Elastic.java (MIT), https://frc-elastic.gitbook.io/docs/additional-features-and-references/robot-notifications-with-elasticlib |
| `SmartDashboard`, `SendableChooser`, `PIDController implements Sendable`, `Command` default names, `getAutonomousCommand` in `autonomousInit`, `RobotModeTriggers`, `WebServer`, `Filesystem` | allwpilib tag `v2026.2.1`; all compiled by the deck check |
| Enter disables, Space stops | https://docs.wpilib.org/en/stable/docs/software/driverstation/driver-station.html |
| 2027 items | PLAN.md, "Changing for 2027" |

## What was simulated

The `tune-gain` plot is computed in `deck.mjs`: a generic arm with no gravity, speed lag `d(speed)/dt = (15 deg/s/V * volts - speed) / 0.4 s`, volts clamped to 12 and held between 20 ms loops, P-only control toward 90 degrees, physics stepped at 1 ms. Callout numbers are computed from the same run. It is not a measurement of any real arm.

## Code

`examples/src/main/java/frc/robot/deck5/util/Elastic.java` is Elastic's own MIT-licensed file from `v2026.1.1`, unchanged except the package line.
