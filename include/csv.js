// This library implements common csv operations.

//-----------------------------------------------------------------------------

csv_error_bad_new_line = -1

function csv_parse_line(line, delimiter, lineterminator){
  // parse a csv line with a given delimiter, line and quote characters
  // the line can contain trailing linebreaks which will be ignored
  // TODO: implement quotechar support
  var elements = [];
  var start = 0;

  for (let i = 0; i < line.length; i++) {
    var char = line[i];

    if (char === delimiter) {
      // Add element before this delimiter
      elements.push(line.slice(start, i));
      start = i + 1;
    } else if (char === lineterminator) {
      if (i !== 0) {
        elements.push(line.slice(start, i));
      }

      // We only accept lineterminators if they are trailing
      for (let j = i + 1; j < line.length; j++) {
        if (line[j] !== lineterminator) {
          return csv_error_bad_new_line
        }
      }
      return elements;
    }
  }

  // add trailing element
  if (line.length > 0) {
    elements.push(line.slice(start));
  }

  return elements;
}
