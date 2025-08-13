impl :: bincode :: Decode for Action
{
    fn decode < __D : :: bincode :: de :: Decoder > (decoder : & mut __D)
    ->core :: result :: Result < Self, :: bincode :: error :: DecodeError >
    {
        let variant_index = < u32 as :: bincode :: Decode >:: decode(decoder)
        ?; match variant_index
        {
            0u32 =>Ok(Self ::None {}), 1u32 =>Ok(Self ::Fold {}), 2u32
            =>Ok(Self ::Check {}), 3u32 =>Ok(Self ::Call {}), 4u32
            =>Ok(Self ::Bet
            { 0 : :: bincode :: Decode :: decode(decoder) ?, }), 5u32
            =>Ok(Self ::Raise
            { 0 : :: bincode :: Decode :: decode(decoder) ?, }), 6u32
            =>Ok(Self ::AllIn
            { 0 : :: bincode :: Decode :: decode(decoder) ?, }), 7u32
            =>Ok(Self ::Chance
            { 0 : :: bincode :: Decode :: decode(decoder) ?, }), variant
            =>Err(:: bincode :: error :: DecodeError :: UnexpectedVariant
            {
                found : variant, type_name : "Action", allowed : &:: bincode
                :: error :: AllowedEnumVariants :: Range { min: 0, max: 7 }
            })
        }
    }
} impl < '__de > :: bincode :: BorrowDecode < '__de > for Action
{
    fn borrow_decode < __D : :: bincode :: de :: BorrowDecoder < '__de > >
    (decoder : & mut __D) ->core :: result :: Result < Self, :: bincode ::
    error :: DecodeError >
    {
        let variant_index = < u32 as :: bincode :: Decode >:: decode(decoder)
        ?; match variant_index
        {
            0u32 =>Ok(Self ::None {}), 1u32 =>Ok(Self ::Fold {}), 2u32
            =>Ok(Self ::Check {}), 3u32 =>Ok(Self ::Call {}), 4u32
            =>Ok(Self ::Bet
            { 0 : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?, }),
            5u32
            =>Ok(Self ::Raise
            { 0 : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?, }),
            6u32
            =>Ok(Self ::AllIn
            { 0 : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?, }),
            7u32
            =>Ok(Self ::Chance
            { 0 : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?, }),
            variant
            =>Err(:: bincode :: error :: DecodeError :: UnexpectedVariant
            {
                found : variant, type_name : "Action", allowed : &:: bincode
                :: error :: AllowedEnumVariants :: Range { min: 0, max: 7 }
            })
        }
    }
}