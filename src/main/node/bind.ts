export default function Bind<T extends Function>(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> | void {
    return {
        configurable: true,
        get(this: T): T {
            const value = descriptor.value.bind(this)
            Object.defineProperty(this, propertyKey, {
                value,
                configurable: true,
                writable: true,
            })
            return value
        },
    }
}