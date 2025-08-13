impl :: bincode :: Decode for State
{
    fn decode < __D : :: bincode :: de :: Decoder > (decoder : & mut __D)
    ->core :: result :: Result < Self, :: bincode :: error :: DecodeError >
    {
        let variant_index = < u32 as :: bincode :: Decode >:: decode(decoder)
        ?; match variant_index
        {
            0u32 =>Ok(Self ::ConfigError {}), 1u32
            =>Ok(Self ::Uninitialized {}), 2u32 =>Ok(Self ::TreeBuilt {}),
            3u32 =>Ok(Self ::MemoryAllocated {}), 4u32 =>Ok(Self ::Solved {}),
            variant
            =>Err(:: bincode :: error :: DecodeError :: UnexpectedVariant
            {
                found : variant, type_name : "State", allowed : &:: bincode ::
                error :: AllowedEnumVariants ::
                Allowed(& [0u32, 1u32, 2u32, 3u32, 4u32])
            })
        }
    }
} impl < '__de > :: bincode :: BorrowDecode < '__de > for State
{
    fn borrow_decode < __D : :: bincode :: de :: BorrowDecoder < '__de > >
    (decoder : & mut __D) ->core :: result :: Result < Self, :: bincode ::
    error :: DecodeError >
    {
        let variant_index = < u32 as :: bincode :: Decode >:: decode(decoder)
        ?; match variant_index
        {
            0u32 =>Ok(Self ::ConfigError {}), 1u32
            =>Ok(Self ::Uninitialized {}), 2u32 =>Ok(Self ::TreeBuilt {}),
            3u32 =>Ok(Self ::MemoryAllocated {}), 4u32 =>Ok(Self ::Solved {}),
            variant
            =>Err(:: bincode :: error :: DecodeError :: UnexpectedVariant
            {
                found : variant, type_name : "State", allowed : &:: bincode ::
                error :: AllowedEnumVariants ::
                Allowed(& [0u32, 1u32, 2u32, 3u32, 4u32])
            })
        }
    }
}