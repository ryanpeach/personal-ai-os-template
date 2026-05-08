export interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface CreateTodoBody {
  title: string;
}

export interface PatchTodoBody {
  title?: string;
  done?: boolean;
}
