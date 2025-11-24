import { ILink } from "./ILink";

// Link List Type Enum
export enum LinkListType {
  LINK = 'link',
  CARD_LINK = 'card-link',
  FILE_LINK = 'file-link'
}

export interface ILinkList {
  Name: string;
  Type: LinkListType;
  Priority: number;
  Links: ILink[];
}
