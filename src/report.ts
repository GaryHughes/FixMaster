export enum ColumnJustification
{
    Left,
    Right
}

export class Column
{
    constructor(name: string, justification: ColumnJustification)
    {
        this.rawName = name;
        this.name = this.rawName.split('\n');
        this.justification = justification;
    }

    public rawName: string;
    public name: string[];
    public justification: ColumnJustification;

}

export class Report {

    public columns: Column[] = [];
    public rows: string[][] = [];
    public footer: string[] = [];

    public addColumn(name: string, justification: ColumnJustification = ColumnJustification.Left) {
        this.columns.push(new Column(name, justification));
    }

    public addRow(...values: string[]) {
        this.rows.push(values);
    }

    public setFooter(...values: string[]) {
        this.footer = values;
    }

    public toString = () : string => {
        var buffer = '';
        // Calculate the column widths
        var columnWidths: number[] = [this.columns.length];
        var columnHeaderRows: number = 0;
        for (var index = 0; index < this.columns.length; ++index) {
            var column = this.columns[index];
            // column headers can be multiline
            columnHeaderRows = Math.max(columnHeaderRows, column.name.length);
            var size = 0;
            // get the widest column name
            column.name.forEach(name => {
                size = Math.max(size, name.length); 
            });
            // get the widest cell value for this column
            this.rows.forEach(row => {
                if (index < row.length) {
                    size = Math.max(size, row[index].length);
                }
            });
            // get the widest footer cell value
            if (index < this.footer.length) {
                size = Math.max(size, this.footer[index].length);
            }
            columnWidths[index] = size;
        }
        // Add the headers
        for (let headerIndex = 0; headerIndex < columnHeaderRows; ++headerIndex) {
            for (let index = 0; index < this.columns.length; ++index) {
                const column = this.columns[index];
                var value = "";
                if (column.name.length === columnHeaderRows) {
                    value = column.name[headerIndex];
                }
                else {
                    let effectiveMax = columnHeaderRows - headerIndex;
                    if (column.name.length >= effectiveMax) {
                        value = column.name[headerIndex - (columnHeaderRows - column.name.length)];
                    }
                }
                if (column.justification === ColumnJustification.Left) {
                    buffer += value.padEnd(columnWidths[index], " ");
                }
                else {
                    buffer += value.padStart(columnWidths[index], " ");
                }
                if (index < this.columns.length - 1) {
                    buffer += "  ";
                }
            }
            buffer += '\n';
        }
        // Add a separator between the headers and the values, 2 spaces between each column
        const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0) + ((columnWidths.length - 1) * 2); 
        buffer += "-".padStart(totalWidth, '-');
        buffer += "\n";
        // Add the data rows        
        for (const row of this.rows) {
            for (index = 0; index < this.columns.length; ++index) {
                const column = this.columns[index];
                if (column.justification === ColumnJustification.Left) {
                    buffer += row[index].padEnd(columnWidths[index]);
                }
                else {
                    buffer += row[index].padStart(columnWidths[index]);
                }
                if (index < this.columns.length - 1) {
                    buffer += "  ";
                }
            }
            buffer += '\n';
        }
        // Add the footer.
        buffer += "-".padStart(totalWidth, '-');
        if (this.footer.length > 0) {
            buffer += '\n';
            for (index = 0; index < this.columns.length; ++index) {
                const column = this.columns[index];
                value = "";
                if (index < this.footer.length) {
                    value = this.footer[index];
                }
                if (column.justification === ColumnJustification.Left) {
                    buffer += value.padStart(columnWidths[index]);
                }
                else {
                    buffer += value.padEnd(columnWidths[index]);
                }
                if (index < this.columns.length - 1) {
                    buffer += "  ";
                }
            }
        }

        return buffer;
    }
}