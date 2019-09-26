# Change Log

All notable changes to the "fixmaster" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Pretty printing of FIX messages within text files including names of field tags, messsage types, and enumerated field values.
- Configurable field separator.
- Configurable regex extraction of data from line prefixes, by default this extracts a timestamp.
- Support for fixtrading.org XML Repository for name lookups.
- Configurable strict/promiscuous name lookup depending on the FIX version of the parsed messages.
