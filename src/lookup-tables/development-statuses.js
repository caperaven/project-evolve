const statusTranslations = globalThis.translations.treeTranslations.developmentStatus;

export const developmentStatuses = Object.freeze({
    DeletedConfirmed: {
        icon: "delete-confirmed",
        title: statusTranslations.DeletedConfirmed,
        color: "#6BB21F"
    },
    DeletedAwaitingConfirmation: {
        icon: "deleted-awaiting-confirmation",
        title: statusTranslations.DeletedAwaitingConfirmation,
        color: "#C04C00"
    },
    ModifiedAwaitingConfirmation: {
        icon: "modified-awaiting-confirmation",
        title: statusTranslations.ModifiedAwaitingConfirmation,
        color: "#C04C00"
    },
    ModifiedUnderDevelopment: {
        icon: "modified-under-development",
        title: statusTranslations.ModifiedUnderDevelopment,
        color: "#00AFDF"
    },
    NewAwaitingConfirmation: {
        icon: "new-awaiting--confirmation",
        title: statusTranslations.NewAwaitingConfirmation,
        color: "#C04C00"
    },
    NewUnderDevelopment: {
        icon: "new-under-development",
        title: statusTranslations.NewUnderDevelopment,
        color: "#00AFDF"
    },
    Confirmed: {
        icon: "check-box",
        title: statusTranslations.Confirmed,
        color: "#6BB21F"
    }
})