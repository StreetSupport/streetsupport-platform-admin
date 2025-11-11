import { ILink } from "./ILink";

// Accommodation Type Enum
export enum LinkListType {
  LINK = 'link',
  CARD_LINK = 'card-link',
  PDF_LINK = 'pdf-link'
}

export interface ILinkList {
  Name: string;
  Description: string;
  Type: LinkListType;
  Priority: number;
  Links: ILink[];
}