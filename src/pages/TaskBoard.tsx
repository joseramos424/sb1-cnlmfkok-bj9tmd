import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { PlusCircle, GripVertical, ChevronDown, Trash2, MessageSquare, MessageSquareDot, ArrowLeft, User, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Textarea } from '../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { supabase } from '../lib/supabase'

type Priority = 'normal' | 'urgente' | 'inmediata'
type Status = 'inicio' | 'enmarcha' | 'acabado'

type Comment = {
  id: string
  content: string
  timestamp: number
  task_id: string
}

type Task = {
  id: string
  content: string
  status: Status
  priority: Priority
  number: number
  comments: Comment[]
  user_id: string
}

type Column = {
  id: Status
  title: string
  tasks: Task[]
  color: string
}

const initialColumns: Column[] = [
  { id: 'inicio', title: 'Tareas', tasks: [], color: 'bg-blue-100' },
  { id: 'enmarcha', title: 'En Marcha', tasks: [], color: 'bg-yellow-100' },
  { id: 'acabado', title: 'Completadas', tasks: [], color: 'bg-red-100' },
]

const priorityColors: Record<Priority, string> = {
  normal: 'bg-green-100',
  urgente: 'bg-orange-100',
  inmediata: 'bg-red-100'
}

const numbers = ['0', ...Array.from({ length: 20 }, (_, i) => (i + 1).toString())]

export default function TaskBoard() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [newTask, setNewTask] = useState('')
  const [newComment, setNewComment] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [urgentNote, setUrgentNote] = useState('')

  useEffect(() => {
    if (userId) {
      fetchUserAndTasks();
    }
  }, [userId])

  const fetchUserAndTasks = async () => {
    try {
      // Fetch user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUserName(userData.name);

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);
      
      if (tasksError) throw tasksError;

      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*');
      
      if (commentsError) throw commentsError;

      const tasksWithComments = tasks.map((task: any) => ({
        ...task,
        comments: comments.filter((comment: any) => comment.task_id === task.id),
        number: task.number ?? 0
      }));

      const newColumns = initialColumns.map(col => ({
        ...col,
        tasks: tasksWithComments.filter((task: Task) => task.status === col.id)
      }));

      setColumns(newColumns);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  }

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result
    if (!destination) return

    const sourceColumn = columns.find(col => col.id === source.droppableId)
    const destColumn = columns.find(col => col.id === destination.droppableId)
    if (!sourceColumn || !destColumn) return

    const task = sourceColumn.tasks[source.index]
    const updatedTask = { ...task, status: destColumn.id }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: destColumn.id })
        .eq('id', task.id)

      if (error) throw error

      const newColumns = columns.map(col => {
        if (col.id === source.droppableId) {
          const newTasks = Array.from(col.tasks)
          newTasks.splice(source.index, 1)
          return { ...col, tasks: newTasks }
        }
        if (col.id === destination.droppableId) {
          const newTasks = Array.from(col.tasks)
          newTasks.splice(destination.index, 0, updatedTask)
          return { ...col, tasks: newTasks }
        }
        return col
      })

      setColumns(newColumns)
    } catch (error) {
      console.error('Error al actualizar tarea:', error)
    }
  }

  const addTask = async () => {
    if (!newTask.trim() || !userId) return

    const task: Omit<Task, 'id' | 'comments'> = {
      content: newTask.trim(),
      status: 'inicio',
      priority: 'normal',
      number: 0,
      user_id: userId
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select()

      if (error) throw error

      const newTask = { ...data[0], comments: [] }
      const newColumns = columns.map(col =>
        col.id === 'inicio' ? { ...col, tasks: [...col.tasks, newTask] } : col
      )

      setColumns(newColumns)
      setNewTask('')
    } catch (error) {
      console.error('Error al añadir tarea:', error)
    }
  }

  const changeTaskPriority = async (taskId: string, newPriority: Priority) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ priority: newPriority })
        .eq('id', taskId)

      if (error) throw error

      const newColumns = columns.map(col => ({
        ...col,
        tasks: col.tasks.map(task =>
          task.id === taskId ? { ...task, priority: newPriority } : task
        )
      }))

      setColumns(newColumns)
    } catch (error) {
      console.error('Error al actualizar prioridad:', error)
    }
  }

  const changeTaskNumber = async (taskId: string, newNumber: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ number: parseInt(newNumber) })
        .eq('id', taskId)

      if (error) throw error

      const newColumns = columns.map(col => ({
        ...col,
        tasks: col.tasks.map(task =>
          task.id === taskId ? { ...task, number: parseInt(newNumber) } : task
        )
      }))

      setColumns(newColumns)
    } catch (error) {
      console.error('Error al actualizar número:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      const newColumns = columns.map(col => ({
        ...col,
        tasks: col.tasks.filter(task => task.id !== taskId)
      }))
      setColumns(newColumns)
    } catch (error) {
      console.error('Error al eliminar tarea:', error)
    }
  }

  const addComment = async () => {
    if (!selectedTask || !newComment.trim()) return

    const comment = {
      content: newComment.trim(),
      task_id: selectedTask.id,
      timestamp: Date.now()
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([comment])
        .select()

      if (error) throw error

      const newColumns = columns.map(col => ({
        ...col,
        tasks: col.tasks.map(task =>
          task.id === selectedTask.id
            ? { ...task, comments: [...task.comments, data[0]] }
            : task
        )
      }))

      setColumns(newColumns)
      setNewComment('')
      setSelectedTask(null)
    } catch (error) {
      console.error('Error al añadir comentario:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <User className="h-8 w-8" />
              {userName}
            </h1>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-800 mb-2">Indicaciones Urgentes</h3>
                <Textarea
                  value={urgentNote}
                  onChange={(e) => setUrgentNote(e.target.value)}
                  placeholder="Escribe aquí las indicaciones urgentes..."
                  className="bg-white/50 border-orange-200"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Añadir nueva tarea..."
              className="flex-grow shadow-sm"
            />
            <Button onClick={addTask} className="shadow-sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Tarea
            </Button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map(column => (
              <div key={column.id} className="flex-1">
                <div className={`rounded-lg shadow-lg overflow-hidden ${column.color}`}>
                  <div className="bg-white bg-opacity-50 px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">{column.title}</h2>
                  </div>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="p-4 min-h-[calc(100vh-300px)]"
                      >
                        {column.tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 mb-3 rounded-lg shadow-sm transition-all hover:shadow-md ${priorityColors[task.priority]}`}
                              >
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                  <span className={`flex-grow text-sm ${task.status === 'acabado' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                    {task.content}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={task.number?.toString() || "0"}
                                      onValueChange={(value) => changeTaskNumber(task.id, value)}
                                    >
                                      <SelectTrigger className="w-[60px] h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {numbers.map(num => (
                                          <SelectItem key={num} value={num}>
                                            {num}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Select
                                      value={task.priority}
                                      onValueChange={(value: Priority) => changeTaskPriority(task.id, value)}
                                    >
                                      <SelectTrigger className="w-[90px] h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="urgente">Urgente</SelectItem>
                                        <SelectItem value="inmediata">Inmediata</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => setSelectedTask(task)}
                                        >
                                          {task.comments.length > 0 ? (
                                            <MessageSquareDot className="h-4 w-4 fill-current" />
                                          ) : (
                                            <MessageSquare className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Comentarios</DialogTitle>
                                          <DialogDescription>
                                            Añadir o ver comentarios de esta tarea.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          {task.comments.map(comment => (
                                            <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                                              <p className="text-sm text-gray-900">{comment.content}</p>
                                              <p className="text-xs text-gray-500 mt-1">
                                                {new Date(comment.timestamp).toLocaleString()}
                                              </p>
                                            </div>
                                          ))}
                                          <Textarea
                                            placeholder="Añadir un comentario..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                          />
                                          <Button onClick={addComment} className="w-full">
                                            Añadir Comentario
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    {task.status === 'acabado' && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-500 hover:text-red-600"
                                        onClick={() => deleteTask(task.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}