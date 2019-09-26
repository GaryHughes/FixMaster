[![Build Status](https://dev.azure.com/garyedwardhughes/FixMaster/_apis/build/status/GaryHughes.FixMaster?branchName=master)](https://dev.azure.com/garyedwardhughes/FixMaster/_build/latest?definitionId=2&branchName=master)

# FIX Master

FIX Master is designed to parse FIX messages from log files and pretty print them in a structured format displaying the names for fields, messages, and enumerated values.

## Extension Settings

**fixmaster.repositoryPath** Path to a fixtrading.org XML Repository. FIX Master includes a copy of the repository that it will use by default.

**fixmaster.nameLookup** `(Strict,Promiscuous)` Governs how names are found for messages, fields, and enumerated values.

**fixmaster.fieldSeparator** The character used to separate fields within a messages. Default is the standard 0x01, some users replace these control characeters when logging.

**fixmaster.prefixPattern** Match this pattern in the part of each line preceding the FIX message. This will be included when formatting the FIX message. The default pattern matches a timestamp with the format yyyy-MM-dd HH:mm:ss.ffffff

## Known Issues

This extension is designed to parse FIX application log files which are typically very large, possibly 100s of MB. Visual Studio Code places limits on the size of files it reads so it
doesn't use excessive amounts of memory and negatively affect performance and possibly crash. If a file is over this size which at the time of writing is 50MB, extensions can't see the file. If you have very large files then cut them up into smaller pieces before attempting to format them with FIX Master.

## Acknowledgements

This extension includes parts of the fixtrading.org XML Repository Copyright (c) FIX Protocol Ltd. All Rights Reserved.
