# Change Log

All notable changes to the **FIX Master** extension will be documented in this file.

This format is based on [Keep a Changelog](http://keepachangelog.com/).

## [1.7.0]

### Changed

- The orchestrations are now generated from FIX.5.0SP2 EP 264.
- The FIX.5.0.* orchestration is now called FIX.Latest to match the versioning scheme of the specifications published by fixtrading.org.

### Fixed

- The orchestrations now include group definitions.
- The Nested Field Indent setting is now respected when pretty printing.
- Fixed an exception that could cause QuickFix data dictionary loading to fail.

## [1.6.1]

### Fixed

- Fixed a bug that would cause the extension to fail if it was configured to delete administrative messages and the last line in file being processed was an administrative message.

## [1.6.0] 2020-10-10

### Added

- FIX Orchestra support has been added. This is now the default data dictionary format.
  - Orchestrations for FIX.4.2, FIX.4.4, and FIX.5.0SP2 EP 258 are included.
  - A new setting `fixmaster.orchestraPath` has been added. This should be a directory containing FIX Orchestra XML files.

### Removed

- FIX Repository support has been removed.
  - A copy of the fixtrading.org XML Repository is no longer included.
  - The setting `fixmaster.repositoryPath` has been removed.

## [1.5.0] 2020-05-13

### Added

- Messages containing fields of type 'data' are now parsed.
  - Because these fields can contain binary data the value will be base64 encoded when pretty printed.

## [1.4.0] 2020-03-28

### Added

- Hover support to pretty print the message on the line under the cursor in a tooltip.
  - It is recommended to decrease `editor.hover.delay` to a smaller value like 100 to make this more responsive.
  - The tooltip can also be triggered by `editor.action.showHover` keyboard shortcut.
  - The parsed message will be highlighted however the default highlight color is quite subtle so you may want to change it to something stronger by adding the following to `settings.json` and adjusting the color to suit your taste.
  ```
  "workbench.colorCustomizations": {
        "editor.hoverHighlightBackground": "#5f615f"
    }
  ```
- A new setting `fixmaster.hoversEnabled` to control whether the hover tooltips are enabled.  

## Changed

- FIX Master will now load when Visual Studio Code starts, not when one of it's commands are run for the first time.
  - This is so the hover tooltips work with no user action.

## [1.3.0] 2020-02-16

### Added

- Command `FIX Master - Pretty Print with Order Book` which will track order messages and print an order book showing their state after each relevant message is printed.
- A new setting `fixmaster.orderBookFields` that controls which fields will be included in the order book.

## [1.2.0] 2019-10-22

### Added

- Command `FIX Master - Show the definition of a field` which will show the field description and enumerated values for all available FIX versions.
- Support for loading a QuickFix data dictionary that can be used to supplement the repository when pretty printing logs.

### Fixed

- Fixed an issue preventing progress notifications from displaying correctly.

## [1.1.0] 2019-10-03

### Added

- A new setting `administrativeMessageBehaviour` to control the inclusion and pretty printing of administrative messages.
  - `IncludeAll` - Pretty print all administrative messages
  - `DeleteAll` - Delete all administrative messages from the output
  - `IgnoreAll` - Leave all administrative messages in the output but do not pretty print
  - `DeleteHeartbeatsAndTestRequests` - Delete Heartbeats and TestRequests from the output
  - `IgnoreHeartbeatsAndTestRequests` - Leave all Heartbeat and TestRequest messages in the output but do not pretty print
- A progress window is now displayed while the format command runs.
- Extension Packs will now be read from the repository if present.
  - The highest number EPnnn directory will be used for any FIX version instead of the Base.
- A new CSV formatting command.
  - The existing command will now appear in the command palette as `FIX Master - Pretty Print`
  - The new command will appear in the command palette as `FIX Master - CSV Format`
  - The CSV format includes the FIX data type for each field.
- New selection formatting commands, these are available in the command palette and the editor context menu when there is selected text.
  - `FIX Master - Pretty Print Selection`
  - `FIX Master - CSV Format Selection`

## [1.0.1] 2019-09-30

### Fixed

- Fixed a bug in the message detection causing messages with a BeginString of FIXT.1.1 to be ignored.

## [1.0.0] 2019-09-29

### Added

- Pretty printing of FIX messages within text files including names of field tags, messsage types, and enumerated field values.
- Configurable field separator.
- Configurable regex extraction of data from line prefixes, by default this extracts a timestamp.
- Configurable indent for fields in repeating groups.
- Support for www.fixtrading.org XML Repository for name lookups.
- Configurable strict/promiscuous name lookup depending on the FIX version of the parsed messages.
