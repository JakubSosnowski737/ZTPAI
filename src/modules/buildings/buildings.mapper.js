function toBuildingResponse(building) {
  return {
    id: building.id,
    name: building.name,
    address: building.address,
    ...(building.roomsCount !== undefined && { roomsCount: building.roomsCount })
  };
}

module.exports = { toBuildingResponse };
