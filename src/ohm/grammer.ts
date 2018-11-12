/*
- benefits of an explicit grammar: error types can include smart messages about why the parsing failed
- can OHM support all of UNICODE
- see https://www.w3.org/TR/rdf11-concepts/
*/
const objectGrammar = `
  Object {
    Literal
      = "\"" char* "\"" langString? dataType?
      
    langString
      = "@" letter (letter | "-")*
      
    dataType
      = dataTypeCurie | dataTypeUri

    dataTypeCurie
      = "^^" letter*
      
    dataTypeUri
      = "<" letter* ">"
      
    curie
      = letter+ ":"
      
    char
      = alnum | "!" | "@" | "#" | "$" | "%" | "^" | "&" | "*" | "(" | ")" | "_" | "-" | "+" | "=" | "{" | "[" | "}" | "]" | "|" | "\\" | ":" | ";" | "\"" | "'" | "<" | "," | ">" | "." | "?" | "/"
  }
`;
