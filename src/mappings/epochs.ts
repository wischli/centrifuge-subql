import { SubstrateEvent } from '@subql/types'
import { Epoch, Tranche } from '../types'

export async function handleEpochClosed(event: SubstrateEvent): Promise<void> {
  logger.info(`Epoch closed: ${event.toString()}`)

  // Close the current epoch
  const [poolId, epochId] = event.event.data
  let epoch = await Epoch.get(`${poolId.toString()}-${epochId.toString()}`)
  epoch.closedAt = event.block.timestamp
  await epoch.save()

  // Create the new epoch
  const newIndex = Number(epochId.toString()) + 1
  let newEpoch = new Epoch(`${poolId.toString()}-${newIndex}`)
  newEpoch.index = newIndex
  newEpoch.poolId = poolId.toString()
  newEpoch.openedAt = event.block.timestamp
  await newEpoch.save()
}

export async function handleEpochExecuted(event: SubstrateEvent): Promise<void> {
  logger.info(`Epoch executed: ${event.toString()}`)

  // Execute the epoch
  const [poolId, epochId] = event.event.data
  let epoch = await Epoch.get(`${poolId.toString()}-${epochId.toString()}`)
  epoch.executedAt = event.block.timestamp
  await epoch.save()

  const tranches = await Tranche.getByPoolId(poolId.toString())
  const outstandingOrders = await Promise.all(
    tranches.map((_1, index: number) => api.query.pools.order.entries({ Tranche: [poolId, index] }))
  )

  logger.info(`Outstanding orders: ${JSON.stringify(outstandingOrders)}`)

  // TODO: loop over order.entries(), apply fulfillment from epoch, create InvestorTransactions
}
