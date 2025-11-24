import { ILinkList } from './ILinkList.js';

export interface IResource {
  _id: string;
  DocumentCreationDate: Date;
  DocumentModifiedDate: Date;
  CreatedBy: string;
  Key: string;
  Name: string;
  Header: string;
  ShortDescription: string;
  // HTML content
  Body: string;
  LinkList: ILinkList[];
}
