impl :: bincode :: Decode for BetSize
{
    fn decode < __D : :: bincode :: de :: Decoder > (decoder : & mut __D)
    ->core :: result :: Result < Self, :: bincode :: error :: DecodeError >
    {
        let variant_index = < u32 as :: bincode :: Decode >:: decode(decoder)
        ?; match variant_index
        {
            0u32
            =>Ok(Self ::PotRelative
            { 0 : :: bincode :: Decode :: decode(decoder) ?, }), 1u32
            =>Ok(Self ::PrevBetRelative
            { 0 : :: bincode :: Decode :: decode(decoder) ?, }), 2u32
            =>Ok(Self ::Additive
            {
                0 : :: bincode :: Decode :: decode(decoder) ?, 1 : :: bincode
                :: Decode :: decode(decoder) ?,
            }), 3u32
            =>Ok(Self ::Geometric
            {
                0 : :: bincode :: Decode :: decode(decoder) ?, 1 : :: bincode
                :: Decode :: decode(decoder) ?,
            }), 4u32 =>Ok(Self ::AllIn {}), variant
            =>Err(:: bincode :: error :: DecodeError :: UnexpectedVariant
            {
                found : variant, type_name : "BetSize", allowed : &:: bincode
                :: error :: AllowedEnumVariants :: Range { min: 0, max: 4 }
            })
        }
    }
} impl < '__de > :: bincode :: BorrowDecode < '__de > for BetSize
{
    fn borrow_decode < __D : :: bincode :: de :: BorrowDecoder < '__de > >
    (decoder : & mut __D) ->core :: result :: Result < Self, :: bincode ::
    error :: DecodeError >
    {
        let variant_index = < u32 as :: bincode :: Decode >:: decode(decoder)
        ?; match variant_index
        {
            0u32
            =>Ok(Self ::PotRelative
            { 0 : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?, }),
            1u32
            =>Ok(Self ::PrevBetRelative
            { 0 : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?, }),
            2u32
            =>Ok(Self ::Additive
            {
                0 : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?, 1
                : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?,
            }), 3u32
            =>Ok(Self ::Geometric
            {
                0 : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?, 1
                : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?,
            }), 4u32 =>Ok(Self ::AllIn {}), variant
            =>Err(:: bincode :: error :: DecodeError :: UnexpectedVariant
            {
                found : variant, type_name : "BetSize", allowed : &:: bincode
                :: error :: AllowedEnumVariants :: Range { min: 0, max: 4 }
            })
        }
    }
}