impl :: bincode :: Decode for BetSizeOptions
{
    fn decode < __D : :: bincode :: de :: Decoder > (decoder : & mut __D)
    ->core :: result :: Result < Self, :: bincode :: error :: DecodeError >
    {
        Ok(Self
        {
            bet : :: bincode :: Decode :: decode(decoder) ?, raise : ::
            bincode :: Decode :: decode(decoder) ?,
        })
    }
} impl < '__de > :: bincode :: BorrowDecode < '__de > for BetSizeOptions
{
    fn borrow_decode < __D : :: bincode :: de :: BorrowDecoder < '__de > >
    (decoder : & mut __D) ->core :: result :: Result < Self, :: bincode ::
    error :: DecodeError >
    {
        Ok(Self
        {
            bet : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?,
            raise : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?,
        })
    }
}