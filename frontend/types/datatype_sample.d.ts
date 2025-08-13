// Temporary ambient module declarations for deprecated sampledata types
// to prevent TS errors while sampledata is still referenced in a few files.

declare module '@/types/datatype_sample' {
  export type PostCard = any
  export type PostCard_bookmark = any
  export type PostDetail = any
  export type PostEdit = any
  export type Stats = any
  export type UserData = any
  export type Model = any
}
