
export enum AdministrativeMessageBehaviour {
	IncludeAll,
	DeleteAll,
	IgnoreAll,
	DeleteHeartbeatsAndTestRequests,
	IgnoreHeartbeatsAndTestRequests
}

export enum CommandScope {
	Document,
	Selection
}

export enum NameLookup {
    Strict,
    Promiscuous
}

export enum EditorReuse {
	New,
	Append,
	Replace
}