export interface IFaq {
  _id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFaqInput {
  question: string;
  answer: string;
  category: string;
  isActive?: boolean;
  order?: number;
}
