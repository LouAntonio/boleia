// Boleia design tokens — paleta "asfalto, tinta e céu"
// Estados: aguardando=laterite · confirmada/ativa=linha · em viagem=linha
//          concluída/verificado=mato · recusada/cancelada/expirada=error
export const colors = {
	light: {
		background: '#F7F3E7', // céu
		text: '#17141B', // asfalto
		primary: '#F2A900', // linha (traço central da estrada)
		laterite: '#B4531F', // terra roxa do interior
		secondary: '#17141B', // asfalto (tinta de leitura)
		border: '#D8D2C4', // ferro claro
		card: '#FFFFFF',
		error: '#E5484D',
		success: '#1F7A5B', // mato
		mato: '#1F7A5B',
		mono: '#17141B',
	},
	dark: {
		background: '#17141B', // asfalto
		text: '#F7F3E7', // tinta clara sobre betume
		primary: '#F2A900',
		laterite: '#C96A35', // laterite mais claro p/ fundo escuro
		secondary: '#C9C4B6', // ferro claro p/ leitura
		border: '#3A3640', // ferro escuro
		card: '#221E28', // asfalto elevado
		error: '#E5484D',
		success: '#3FAE84', // mato mais claro
		mato: '#3FAE84',
		mono: '#D8D2C4',
	},
};