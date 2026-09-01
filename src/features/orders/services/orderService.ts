import { callFunction } from '@/lib/firebase/functions';
import type { CheckoutValue } from '@/schemas/checkoutSchema';
import type { OrderStatus } from '@/constants/enums';
export interface CreateOrderInput extends CheckoutValue { shopId:string; items:Array<{productId:string;qty:number}>; }
export interface CreateOrderResult { orderId:string; subtotal:number; }
export async function createOrder(input:CreateOrderInput):Promise<CreateOrderResult>{return callFunction('createOrder',input);}
export async function updateOrderStatus(input:{shopId:string;orderId:string;status:OrderStatus;cancelReason?:string;items?:Array<{productId:string;qty:number}>}):Promise<void>{await callFunction('updateOrderStatus',input);}
export async function cancelOwnOrder(input:{shopId:string;orderId:string;reason:string}):Promise<void>{await callFunction('cancelOrder',input);}
export async function getCheckoutPrefill(input:{shopId:string;phone:string}):Promise<{name:string;address:string;village?:string;landmark?:string}|null>{return callFunction('getCheckoutPrefill',input);}
