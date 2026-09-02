function calculateWorkingHours(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const differenceInMs = end - start;

    const differenceInHours = differenceInMs / (1000 * 60 * 60);

    return Number(differenceInHours.toFixed(2));
}

module.exports = calculateWorkingHours;