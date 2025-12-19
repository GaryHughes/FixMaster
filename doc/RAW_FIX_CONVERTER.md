# Convert Pretty-Printed FIX to Raw FIX Format

This guide shows you how to use the new "Convert to Raw FIX" commands to transform pretty-printed FIX messages back into their raw protocol format.

## What's New

Two new commands have been added:
- **FIX Master - Convert to Raw FIX**: Converts entire document from pretty-printed to raw FIX
- **FIX Master - Convert Selection to Raw FIX**: Converts only selected text

## How It Works

The commands parse pretty-printed FIX messages like this:

```
NewOrderSingle
{
    BeginString (8) FIX.4.4
      BodyLength (9) 140
         MsgType (35) D - NewOrderSingle
    SenderCompID (49) INITIATOR
    TargetCompID (56) ACCEPTOR
          MsgSeqNum (34) 2282
      SendingTime (52) 20190929-04:51:00.849
         ClOrdID (11) 50
     AllocAccount (70) 49
        ExDestination (100) AUTO
          Symbol (55) WTF
            Side (54) 1 - Buy
    TransactTime (60) 20190929-04:35:33.562
        OrderQty (38) 10000
        OrdType (40) 1 - Market
    TimeInForce (59) 1 - GoodTillCancel
        CheckSum (10) 129
}
```

And converts them to raw FIX format:

```
8=FIX.4.4�9=140�35=D�49=INITIATOR�56=ACCEPTOR�34=2282�52=20190929-04:51:00.849�11=50�70=49�100=AUTO�55=WTF�54=1�60=20190929-04:35:33.562�38=10000�40=1�59=1�10=129�
```

(Note: `�` represents the SOH character `0x01` which is the standard FIX field delimiter)

## Usage

### Method 1: Command Palette

1. Open a file with pretty-printed FIX messages (usually a `.fix` file)
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "FIX Master - Convert to Raw FIX"
4. Press Enter
5. A new document opens in a side-by-side view with the raw FIX output

### Method 2: Convert Selection Only

1. Select one or more pretty-printed messages
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "FIX Master - Convert Selection to Raw FIX"
4. Press Enter
5. A new document opens with the converted selection

### Method 3: Right-Click Context Menu

1. Select the text you want to convert
2. Right-click to open the context menu
3. Choose "FIX Master - Convert Selection to Raw FIX"

## Testing the Feature

### Step 1: Create a Test File

1. In VS Code, press `F5` to launch the Extension Development Host
2. Create a new file with this content:

```
NewOrderSingle
{
    BeginString (8) FIX.4.4
         MsgType (35) D - NewOrderSingle
    SenderCompID (49) INITIATOR
    TargetCompID (56) ACCEPTOR
         ClOrdID (11) ORDER123
            Side (54) 1 - Buy
          Symbol (55) AAPL
        OrderQty (38) 100
        OrdType (40) 2 - Limit
           Price (44) 150.50
}
```

### Step 2: Run the Command

1. Press `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Run "FIX Master - Convert to Raw FIX"
3. You should see a new document with raw FIX output

### Step 3: Verify Round-Trip

To verify the conversion works correctly:

1. Copy the raw FIX output from the new document
2. Create another new file and paste the raw FIX
3. Run "FIX Master - Pretty Print"
4. Compare with the original pretty-printed message - they should match!

## Features

### Multiple Messages

The command handles multiple messages in the same document:

```
Logon
{
    BeginString (8) FIX.4.4
    ...
}

NewOrderSingle
{
    BeginString (8) FIX.4.4
    ...
}
```

Both messages will be converted to raw FIX format.

### Preserves Non-Message Lines

Lines outside message blocks (like headers, timestamps, or notes) are preserved:

```
=== Trading Session 2024-01-15 ===

NewOrderSingle
{
    ...
}

=== End of Session ===
```

### Data Fields

Base64-encoded data fields (like Signature, SecureData) are automatically decoded back to their binary representation.

## Use Cases

1. **Message Replay**: Convert formatted messages back to raw FIX for replaying to a test environment
2. **Debugging**: Compare raw messages before and after formatting
3. **Log Analysis**: Extract specific messages from logs and convert them for injection into test systems
4. **Message Modification**: Edit pretty-printed messages and convert back to raw FIX
5. **Integration Testing**: Generate raw FIX messages from human-readable format

## Implementation Details

- Parser: `parsePrettyPrintedMessage()` in `src/fixProtocol.ts`
- Formatter: `fixFormatPrintMessage()` in `src/fixProtocol.ts`
- Command Handler: `formatRawFix()` in `src/extension.ts`

## Limitations

- The converter relies on the tag numbers in parentheses to extract field values
- Enumerated values (e.g., "1 - Buy") are correctly parsed to extract just the value ("1")
- The output is always in a new document (doesn't support in-place replacement)
