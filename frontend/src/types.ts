export type FieldType = "text" | "textarea" | "list" | "tags";

export type TemplateField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  defaultStyle?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    textColor?: string;
  };
};

export type Template = {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
  fields: TemplateField[];
};

export type DocumentIndexEntry = {
  id: string;
  title: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
};

export type FieldStyle = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  textColor?: string;
};

export type DocumentModel = {
  id: string;
  title: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
  data: Record<string, unknown>;
  styles: Record<string, FieldStyle>;
  theme: Record<string, string>;
};

