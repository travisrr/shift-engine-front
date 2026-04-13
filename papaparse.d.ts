declare module 'papaparse' {
  type ParseConfig = {
    header?: boolean
    skipEmptyLines?: boolean
    transformHeader?: (header: string) => string
  }

  type ParseError = {
    message: string
  }

  type ParseResult<T> = {
    data: T[]
    errors: ParseError[]
  }

  const Papa: {
    parse<T>(input: string, config: ParseConfig): ParseResult<T>
  }

  export default Papa
}
