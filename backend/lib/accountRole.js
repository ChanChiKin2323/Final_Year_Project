export const primaryEmail = (user) => {
    const match = user.emailAddresses?.find((item) => item.id === user.primaryEmailAddressId)
    return (match?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '').toLowerCase()
}
