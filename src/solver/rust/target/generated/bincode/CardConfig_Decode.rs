impl :: bincode :: Decode for CardConfig
{
    fn decode < __D : :: bincode :: de :: Decoder > (decoder : & mut __D)
    ->core :: result :: Result < Self, :: bincode :: error :: DecodeError >
    {
        Ok(Self
        {
            range : :: bincode :: Decode :: decode(decoder) ?, flop : ::
            bincode :: Decode :: decode(decoder) ?, turn : :: bincode ::
            Decode :: decode(decoder) ?, river : :: bincode :: Decode ::
            decode(decoder) ?,
        })
    }
} impl < '__de > :: bincode :: BorrowDecode < '__de > for CardConfig
{
    fn borrow_decode < __D : :: bincode :: de :: BorrowDecoder < '__de > >
    (decoder : & mut __D) ->core :: result :: Result < Self, :: bincode ::
    error :: DecodeError >
    {
        Ok(Self
        {
            range : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?,
            flop : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?,
            turn : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?,
            river : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?,
        })
    }
}