export interface ISubItem {
  id: number;
  title: string;
  done: boolean;
}

export interface IFocusItem {
  id: number;
  title: string;
  done: boolean;
  subtasks: ISubItem[];
  expanded: boolean;
}
