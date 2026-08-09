// Rótulos e tom dos estados de negócio (PT-AO)
export const STATUS_LABEL: Record<string, string> = {
	programada: 'Programada',
	em_curso: 'Em viagem',
	em_viagem: 'Em viagem',
	concluida: 'Concluída',
	cancelada: 'Cancelada',
	recusada: 'Recusada',
	expirada: 'Expirada',
	pedido: 'A aguardar',
	confirmada: 'Confirmada',
	verificado: 'Verificado',
	verificada: 'Verificada',
	pendente: 'Pendente',
	nao_submetido: 'Por submeter',
	recusado: 'Recusado',
	novo: 'Novo',
	pagamento_pendente: 'Por pagar',
	pagamento_devolvido: 'Reembolso',
};

export type StatusTone =
	| 'pending' // laterite — aguardar/programada
	| 'active' // primary — confirmada/em curso
	| 'done' // mato — concluída/verificado
	| 'failed' // error — cancelada/recusada/expirada
	| 'neutral'; // ferro

export const STATUS_TONE: Record<string, StatusTone> = {
	programada: 'pending',
	pedido: 'pending',
	pendente: 'pending',
	pendente_kyc: 'pending',
	pagamento_pendente: 'pending',
	novo: 'pending',
	em_curso: 'active',
	em_viagem: 'active',
	confirmada: 'active',
	concluida: 'done',
	verificado: 'done',
	verificada: 'done',
	pagamento_devolvido: 'done',
	cancelada: 'failed',
	recusada: 'failed',
	recusado: 'failed',
	expirada: 'failed',
	nao_submetido: 'neutral',
};

export function statusMeta(status: string): {
	label: string;
	tone: StatusTone;
} {
	return {
		label: STATUS_LABEL[status] ?? status,
		tone: STATUS_TONE[status] ?? 'neutral',
	};
}
