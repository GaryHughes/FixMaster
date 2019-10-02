# Change Log

All notable changes to the **FIX Master** extension will be documented in this file.

This format is based on [Keep a Changelog](http://keepachangelog.com/).

## [UNRELEASED]

### Added

- `administrativeMessageBehaviour` setting to control the inclusion and pretty printing of administrative messages.
  - `IncludeAll` - Pretty print all administrative messages
  - `DeleteAll` - Delete all administrative messages from the output
  - `IgnoreAll` - Leave all administrative messages in the output but do not pretty print
  - `DeleteHeartbeatsAndTestRequests` - Delete Heartbeats and TestRequests from the output
  - `IgnoreHeartbeatsAndTestRequests` - Leave all Heartbeat and TestRequest messages in the output but do not pretty print
- A progress window is now displayed while the format command runs.
- Extension Packs will now be read from the repository if present.
  - The highest number EPnnn directory will be used for any FIX version instead of the Base.

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
