'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Folder, Calendar, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Stage {
  id: string
  name: string
  color: string | null
}

interface Project {
  id: string
  title: string
  description: string | null
  stage: string
  due_date: string | null
  contacts: {
    id: string
    name: string
    companies: {
      name: string
    } | null
  } | null
}

interface ProjectKanbanProps {
  stages: Stage[]
  projects: Project[]
  workspaceSlug: string
  workspaceId: string
}

export function ProjectKanban({ stages, projects: initialProjects, workspaceSlug, workspaceId }: ProjectKanbanProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [draggedProject, setDraggedProject] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProject(projectId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()

    if (!draggedProject) return

    // Optimistic update
    setProjects(prev =>
      prev.map(project =>
        project.id === draggedProject
          ? { ...project, stage: targetStage }
          : project
      )
    )
    setDraggedProject(null)

    // Persist to database
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .update({ stage: targetStage })
        .eq('id', draggedProject)

      if (error) {
        console.error('Error updating project stage:', error)
        setProjects(initialProjects)
      }
    } catch (error) {
      console.error('Error:', error)
      setProjects(initialProjects)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('es-MX', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map(stage => {
        const stageProjects = projects.filter(p => p.stage === stage.name)

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80 bg-slate-50 rounded-lg"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.name)}
          >
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                <span className="text-sm text-slate-600">{stageProjects.length}</span>
              </div>
            </div>

            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {stageProjects.map(project => {
                const isOverdue = project.due_date && new Date(project.due_date) < new Date()

                return (
                  <Link
                    key={project.id}
                    href={`/${workspaceSlug}/projects/${project.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    className="block bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-move"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Folder className="h-4 w-4 text-slate-400 mt-0.5" />
                      <h4 className="font-medium text-slate-900 flex-1">{project.title}</h4>
                    </div>

                    {project.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      {project.contacts && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{project.contacts.name}</span>
                        </div>
                      )}

                      {project.due_date && (
                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(project.due_date)}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}

              {stageProjects.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8">
                  No hay proyectos
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
