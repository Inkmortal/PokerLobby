impl :: bincode :: Decode for BoardState
{
    fn decode < __D : :: bincode :: de :: Decoder > (decoder : & mut __D)
    ->core :: result :: Result < Self, :: bincode :: error :: DecodeError >
    {
        let variant_index = < u32 as :: bincode :: Decode >:: decode(decoder)
        ?; match variant_index
        {
            0u32 =>Ok(Self ::Flop {}), 1u32 =>Ok(Self ::Turn {}), 2u32
            =>Ok(Self ::River {}), variant
            =>Err(:: bincode :: error :: DecodeError :: UnexpectedVariant
            {
                found : variant, type_name : "BoardState", allowed : &::
                bincode :: error :: AllowedEnumVariants ::
                Allowed(& [0u32, 1u32, 2u32])
            })
        }
    }
} impl < '__de > :: bincode :: BorrowDecode < '__de > for BoardState
{
    fn borrow_decode < __D : :: bincode :: de :: BorrowDecoder < '__de > >
    (decoder : & mut __D) ->core :: result :: Result < Self, :: bincode ::
    error :: DecodeError >
    {
        let variant_index = < u32 as :: bincode :: Decode >:: decode(decoder)
        ?; match variant_index
        {
            0u32 =>Ok(Self ::Flop {}), 1u32 =>Ok(Self ::Turn {}), 2u32
            =>Ok(Self ::River {}), variant
            =>Err(:: bincode :: error :: DecodeError :: UnexpectedVariant
            {
                found : variant, type_name : "BoardState", allowed : &::
                bincode :: error :: AllowedEnumVariants ::
                Allowed(& [0u32, 1u32, 2u32])
            })
        }
    }
}