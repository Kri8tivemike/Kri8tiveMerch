// Inspired by react-hot-toast library
import * as React from "react"




const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type ToasterToast = ToastProps & {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  dismissible?: boolean;
  duration?: number;
  variant?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }

    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }

    default:
      return state
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    })

  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

// Helper methods for common toast types
toast.success = (message: string) => {
  return toast({ 
    title: "Success",
    description: message,
    variant: "default" 
  });
}

toast.error = (message: string) => {
  return toast({ 
    title: "Error",
    description: message,
    variant: "destructive" 
  });
}

toast.loading = (message: string) => {
  return toast({ 
    title: "Loading",
    description: message,
  });
}

toast.promise = async <T,>(
  promise: Promise<T>,
  msgs: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  const toastId = toast({ 
    title: "Loading",
    description: msgs.loading 
  }).id;
  
  try {
    const data = await promise;
    toast.dismiss(toastId);
    toast({ 
      title: "Success",
      description: msgs.success 
    });
    return data;
  } catch (error) {
    toast.dismiss(toastId);
    toast({ 
      title: "Error",
      description: msgs.error,
      variant: "destructive"
    });
    throw error;
  }
}

toast.custom = (render: (id: string) => JSX.Element, options?: { duration?: number }) => {
  const id = genId();
  const onOpenChange = (open: boolean) => {
    if (!open) dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });
  };

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      id,
      open: true,
      onOpenChange,
      action: render(id),
      duration: options?.duration,
    },
  });

  return {
    id,
    dismiss: () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id }),
    update: (props: ToasterToast) => 
      dispatch({ 
        type: actionTypes.UPDATE_TOAST, 
        toast: { ...props, id } 
      }),
  };
};

toast.dismiss = (toastId?: string) => {
  dispatch({ type: actionTypes.DISMISS_TOAST, toastId })
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}

export { useToast, toast }
