'use client'

import { useState } from 'react'
import { Plus, CheckCircle, Circle, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  completed_at: string | null
}

interface ProjectTasksProps {
  projectId: string
  workspaceId: string
  initialTasks: Task[]
}

export function ProjectTasks({ projectId, workspaceId, initialTasks }: ProjectTasksProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          workspace_id: workspaceId,
          project_id: projectId,
          title: newTaskTitle,
          status: 'pending',
          priority: 'medium'
        })
        .select()
        .single()

      if (error) throw error

      setTasks([data, ...tasks])
      setNewTaskTitle('')
      setShowAddTask(false)
      router.refresh()
    } catch (error) {
      console.error('Error adding task:', error)
      alert('Error al agregar la tarea')
    }
  }

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId)

      if (error) throw error

      setTasks(tasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
          : task
      ))
      router.refresh()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      setTasks(tasks.filter(task => task.id !== taskId))
      router.refresh()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Tareas</h2>
        <button
          onClick={() => setShowAddTask(true)}
          className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          <Plus className="h-4 w-4" />
          Agregar tarea
        </button>
      </div>

      <div className="p-6">
        {/* Add Task Form */}
        {showAddTask && (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Título de la tarea..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                Agregar
              </button>
              <button
                onClick={() => {
                  setShowAddTask(false)
                  setNewTaskTitle('')
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div className="space-y-2 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Pendientes</h3>
            {pendingTasks.map(task => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <button
                  onClick={() => handleToggleTask(task.id, task.status)}
                  className="flex-shrink-0 mt-0.5"
                >
                  <Circle className="h-5 w-5 text-slate-400 hover:text-purple-600" />
                </button>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="flex-shrink-0 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Completadas</h3>
            {completedTasks.map(task => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors opacity-60"
              >
                <button
                  onClick={() => handleToggleTask(task.id, task.status)}
                  className="flex-shrink-0 mt-0.5"
                >
                  <CheckCircle className="h-5 w-5 text-green-600 hover:text-slate-400" />
                </button>
                <div className="flex-1">
                  <p className="text-sm text-slate-900 line-through">{task.title}</p>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="flex-shrink-0 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tasks.length === 0 && !showAddTask && (
          <div className="text-center py-12">
            <Circle className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No hay tareas aún</p>
            <button
              onClick={() => setShowAddTask(true)}
              className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Agregar primera tarea
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
