export interface AIProvider { complete(system: string, user: string): Promise<string>; }
type CorePayload = { question: string; context: { project: { name: string; methodology: string }; findings: { metrics: { progress: number; blockedTasks: number; overdueTasks: number; pendingTasks: number; riskCount: number; issueCount: number; milestoneProgress: number }; problems: { description: string }[] } } };

export class SanzuCoreProvider implements AIProvider {
	async complete(_system: string, user: string) {
		const payload = JSON.parse(user) as CorePayload;
		const { question, context } = payload;
		const { project, findings } = context;
		const metrics = findings.metrics;
		const problems = findings.problems.length ? findings.problems.map((item) => item.description).join(" ") : "No se detectaron problemas críticos en el análisis actual.";
		const questionText = question.toLowerCase();
		let action = "Prioriza el siguiente trabajo de mayor impacto y revisa el análisis del proyecto.";
		if (questionText.includes("riesgo")) action = metrics.riskCount ? "Asigna responsables y define mitigación para cada riesgo abierto." : "Mantén el registro de riesgos actualizado y revísalo en cada ciclo.";
		else if (questionText.includes("retras") || questionText.includes("detrás") || questionText.includes("schedule")) action = metrics.overdueTasks ? "Replanifica las tareas vencidas, revisa dependencias y acuerda una nueva fecha." : "Compara el progreso actual con las fechas objetivo y ajusta el plan si cambia el alcance.";
		else if (questionText.includes("bloque") || questionText.includes("acumul")) action = metrics.blockedTasks ? "Reúne a los responsables de las tareas bloqueadas y elimina primero el impedimento más antiguo." : "No hay tareas bloqueadas registradas; continúa vigilando el flujo.";
		else if (project.methodology === "KANBAN") action = "Limita el trabajo en curso y extrae la siguiente tarea solo cuando haya capacidad.";
		else if (project.methodology === "SCRUM") action = "Revisa el objetivo del Sprint, el backlog priorizado y la capacidad real del equipo.";
		return `Contexto de ${project.name}: metodología ${project.methodology}. Progreso: ${metrics.progress}%. Pendientes: ${metrics.pendingTasks}. Bloqueadas: ${metrics.blockedTasks}. Vencidas: ${metrics.overdueTasks}. Riesgos: ${metrics.riskCount}. Issues: ${metrics.issueCount}. Progreso de hitos: ${metrics.milestoneProgress}%. ${problems} Acción sugerida: ${action}`;
	}
}
